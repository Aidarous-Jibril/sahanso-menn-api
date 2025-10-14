const express = require("express");
const { processStripe, loadStripe, processPayPal, capturePayPalPayment } = require("../controllers/paymentController");

const router = express.Router();

// Stripe routes
router.post("/stripe/process", processStripe);
router.get("/stripe/key", loadStripe);

// PayPal routes
router.post("/paypal/process", processPayPal);
router.post("/paypal/capture", capturePayPalPayment);

module.exports = router;
