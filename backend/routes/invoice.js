// routes/invoice.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// POST /api/invoice
router.post("/", async (req, res) => {
  const { name, email, phone, selectedPlan, transactionId } = req.body;

  if (!name || !email || !selectedPlan || !transactionId)
    return res.status(400).json({ success: false, message: "Missing fields" });

  try {
    // Setup your mail transport (you can use Gmail, Mailgun, etc.)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.MAIL_USER, // your email
        pass: process.env.MAIL_PASS, // your app password
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Your Payment Invoice - StreamFlow",
      html: `
        <h2>Thank you for your purchase, ${name}!</h2>
        <p>Here are your transaction details:</p>
        <ul>
          <li><strong>Plan:</strong> ${selectedPlan}</li>
          <li><strong>Transaction ID:</strong> ${transactionId}</li>
          <li><strong>Phone:</strong> ${phone}</li>
        </ul>
        <p>We will activate your plan shortly.</p>
        <br/>
        <p>Regards,</p>
        <strong>StreamFlow Team</strong>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Invoice sent successfully" });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ success: false, message: "Failed to send invoice" });
  }
});

module.exports = router;
