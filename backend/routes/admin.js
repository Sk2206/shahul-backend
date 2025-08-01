const express = require("express");
const router = express.Router();
const multer = require("multer");
const PaymentAccount = require("../models/PaymentAccount");
const path = require("path");
// import DashboardPage from "./DashboardPage";
// import UsersPage from "./UsersPage";
// import VideosPage from "./VideosPage";
// import PaymentPage from "./PaymentPage";

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// GET all accounts + active
router.get("/payment-accounts", async (req, res) => {
  const accounts = await PaymentAccount.find();
  res.json({ accounts });
});

// ADD new account
router.post(
  "/payment-accounts",
  upload.single("qrCode"),
  async (req, res) => {
    try {
      const { type, upiId, bankName, accountNumber, ifsc } = req.body;
      const qrCodePath = req.file ? "/uploads/" + req.file.filename : null;

      if (type === "upi") {
        if (!upiId) return res.status(400).json({ error: "UPI ID is required" });
        // Save UPI account
        const upi = await PaymentAccount.create({
          type: "upi",
          upiId,
          qrCodeUrl: qrCodePath,
        });
        return res.status(201).json({ success: true, account: upi });
      } else if (type === "bank") {
        if (!bankName || !accountNumber || !ifsc)
          return res.status(400).json({ error: "Bank details are required" });
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
  const { accountId } = req.body;
  await PaymentAccount.updateMany({}, { isActive: false });
  await PaymentAccount.findByIdAndUpdate(accountId, { isActive: true });
  res.json({ message: "Active account updated" });
});

// DELETE payment account by ID
router.delete("/payment-accounts/:id", async (req, res) => {
  try {
    await PaymentAccount.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

{/* <Routes>
  <Route
    path="/dashboard"
    element={<DashboardPage totalUsers={totalUsers} totalVideos={totalVideos} totalMembers={totalMembers} />}
  />
  <Route
    path="/users"
    element={<UsersPage users={users} onBan={handleBanUser} onDelete={handleDeleteUser} />}
  />
  <Route
    path="/videos"
    element={<VideosPage videos={videos} onDelete={handleDeleteVideo} />}
  />
  <Route
    path="/payment"
    element={
      <PaymentPage
        currentAccount={currentAccount}
        paymentAccounts={paymentAccounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        handleActivate={handleActivate}
        handleDeleteAccount={handleDeleteAccount}
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        newAccount={newAccount}
        setNewAccount={setNewAccount}
        handleAddAccount={handleAddAccount}
      />
    }
  />
</Routes> */}

module.exports = router;