const express = require("express");
const router = express.Router();
const multer = require("multer");
const PaymentAccount = require("../models/PaymentAccount");
const fs = require("fs");
const path = require("path");
 
// -------------------- Ensure uploads folder exists --------------------
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
 
// -------------------- Multer config --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
 
const upload = multer({ storage });
 
// -------------------- Routes --------------------
 
// GET all accounts
router.get("/payment-accounts", async (req, res) => {
  try {
    const accounts = await PaymentAccount.find();
    res.json({ accounts });
  } catch (err) {
    console.error("GET /payment-accounts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
 
// ADD new account (with optional QR code)
router.post(
  "/payment-accounts",
  upload.single("qrCode"), // field name must be "qrCode" in frontend
  async (req, res) => {
    try {
      console.log("Body:", req.body);
      console.log("File:", req.file);
 
      const { type, upiId, bankName, accountNumber, ifsc } = req.body;
      const qrCodePath = req.file ? "/uploads/" + req.file.filename : null;
 
      if (type === "upi") {
        if (!upiId) {
          return res.status(400).json({ error: "UPI ID is required" });
        }
 
        const upi = await PaymentAccount.create({
          type: "upi",
          upiId,
          qrCodeUrl: qrCodePath,
        });
 
        return res.status(201).json({ success: true, account: upi });
      } else if (type === "bank") {
        if (!bankName || !accountNumber || !ifsc) {
          return res.status(400).json({ error: "Bank details are required" });
        }
 
        const bank = await PaymentAccount.create({
          type: "bank",
          bankName,
          accountNumber,
          ifsc,
        });
 
        return res.status(201).json({ success: true, account: bank });
      } else {
        return res.status(400).json({ error: "Invalid account type" });
      }
    } catch (err) {
      console.error("POST /payment-accounts error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);
 
// SET active account
router.put("/payment-accounts/activate", async (req, res) => {
  try {
    const { accountId } = req.body;
 
    await PaymentAccount.updateMany({}, { isActive: false });
    await PaymentAccount.findByIdAndUpdate(accountId, { isActive: true });
 
    res.json({ message: "Active account updated" });
  } catch (err) {
    console.error("PUT /payment-accounts/activate error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
 
// DELETE payment account
router.delete("/payment-accounts/:id", async (req, res) => {
  try {
    await PaymentAccount.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment account deleted successfully" });
  } catch (err) {
    console.error("DELETE /payment-accounts/:id error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});
 
module.exports = router;
