const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/contact', async (req, res) => {
  const { subject, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true, // true for 465, false for 587
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });      

      await transporter.sendMail({
        from: `"Multimart Support" <${process.env.SMTP_EMAIL}>`,
        to: process.env.ADMIN_EMAIL,
        replyTo: req.body.email, // ← this lets admin reply to customer directly
        subject: `Customer Support Request: ${subject}`,
        text: message,
      });
      

    res.status(200).json({ message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ message: 'Email sending failed.' });
  }
});

module.exports = router;
