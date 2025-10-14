//paymentController.js
const { strip } = require("colors");
const express = require("express");
const paypal = require("paypal-rest-sdk");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

// process stripe payment
const processStripe = async (req, res, next) => {
    const myPayment = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "sek",
        metadata: {
            company: "Haad"
        }
    });
    res.status(200).json({ success: true, client_secret: myPayment.client_secret });
  };

// get all products 
const loadStripe = async (req, res, next) => {
    res.status(200).json({ stripeApiKey: process.env.STRIPE_PUBLISHEABLE_KEY});
  };


paypal.configure({
  mode: "sandbox", // Change to 'live' when deploying to production
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

// Process PayPal Payment
const processPayPal = async (req, res) => {
  try {
    let { total } = req.body;

    if (typeof total !== "number") {
      console.error("Invalid total value:", total);
      return res.status(400).json({ message: "Invalid total amount" });
    }

    const formattedTotal = parseFloat(total).toFixed(2);


    const paymentData = {
      intent: "sale",
      payer: { payment_method: "paypal" },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/order-success`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      },  
      transactions: [
        {
          amount: {
            total: total.toFixed(2),
            currency: "SEK",
          },
          description: "Purchase from Haad Marketplace",
        },
      ],
    };

    paypal.payment.create(paymentData, (error, payment) => {
      if (error) {
        console.error("PayPal Error:", error.response);
        return res.status(500).json({ message: "PayPal payment failed", error });
      }

      const approvalUrl = payment.links.find((link) => link.rel === "approval_url");

      if (!approvalUrl) {
        console.error("PayPal Response:", payment);
        return res.status(500).json({ message: "No approval URL found in PayPal response" });
      }

      res.status(200).json({ success: true, approvalUrl: approvalUrl.href });
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Capture PayPal Payment
const capturePayPalPayment = async (req, res) => {
  const { paymentId, payerId } = req.body;

  if (!paymentId || !payerId) {
    return res.status(400).json({ message: "Missing payment details" });
  }

  try {
    paypal.payment.execute(paymentId, { payer_id: payerId }, async (error, payment) => {
      if (error) {
        console.error("PayPal Execution Error:", error.response);
        return res.status(500).json({ message: "Payment execution failed", error });
      }

      if (payment.state === "approved") {

        return res.status(200).json({
          success: true,
          payment,
          transactionId: payment.id,
        });
      } else {
        console.error("Payment not approved:", payment);
        return res.status(400).json({ success: false, message: "Payment not approved" });
      }
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};



module.exports = {
  processStripe,
  loadStripe,
  processPayPal,
  capturePayPalPayment,
};
