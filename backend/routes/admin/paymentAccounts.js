const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const PaymentAccount = require("../../models/PaymentAccount.js");



const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

router.post("/", upload.single("qrCode"), async (req, res) => {
  try {
    const { type, upiId, bankName, accountNumber, ifsc } = req.body;

    if (!type) return res.status(400).json({ success: false, message: "Type is required" });

    let accountData = { type };

    if (type === "upi") {
      if (!upiId) return res.status(400).json({ success: false, message: "UPI ID required" });
      accountData.upiId = upiId;
      if (req.file) accountData.qrCodeUrl = `/uploads/${req.file.filename}`;
    } else {
      if (!bankName || !accountNumber || !ifsc)
        return res.status(400).json({ success: false, message: "Bank details required" });
      Object.assign(accountData, { bankName, accountNumber, ifsc });
    }

    const newAccount = new PaymentAccount(accountData);
    await newAccount.save();

    res.status(201).json({ success: true, account: newAccount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const accounts = await PaymentAccount.find();
    res.json({ accounts });
  } catch {
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

router.put("/activate/:id", async (req, res) => {
  try {
    await PaymentAccount.updateMany({}, { isActive: false });
    const updated = await PaymentAccount.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    res.json({ success: true, account: updated });
  } catch {
    res.status(500).json({ error: "Failed to update account" });
  }
});
router.put("/activate", async (req, res) => {
  const { accountId } = req.body;
  if (!accountId) return res.status(400).json({ error: "Account ID required" });

  await PaymentAccount.updateMany({}, { isActive: false });
  await PaymentAccount.findByIdAndUpdate(accountId, { isActive: true });

  res.json({ message: "Active account updated" });
});
module.exports = router;
