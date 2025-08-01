const mongoose = require("mongoose");

const PaymentAccountSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["upi", "bank"],
    required: true,
  },
  upiId: {
    type: String,
    required: function () {
      return this.type === "upi";
    },
  },
  qrCodeUrl: {
    type: String,
  },
  bankName: {
    type: String,
    required: function () {
      return this.type === "bank";
    },
  },
  accountNumber: {
    type: String,
    required: function () {
      return this.type === "bank";
    },
  },
  ifsc: {
    type: String,
    required: function () {
      return this.type === "bank";
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
   isActive: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("PaymentAccount", PaymentAccountSchema);
