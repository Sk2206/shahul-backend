// routes/user.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Upgrade plan (dummy logic)
// GET user account info
router.get("/account", async (req, res) => {
  const { email } = req.query;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ plan: user.plan || "Basic" });
  } catch (err) {
    res.status(500).json({ error: "Error fetching account" });
  }
});

// PUT upgrade plan
router.put("/account/upgrade", async (req, res) => {
  const { email, newPlan } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { plan: newPlan || "Pro" },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Plan upgraded", plan: user.plan });
  } catch (err) {
    res.status(500).json({ error: "Failed to upgrade plan" });
  }
});


module.exports = router;
