const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  videoUrl: String,
  thumbnail: String,
  visibility: {
  type: String,
  enum: ["free", "paid"],
  default: "free"
}
});

module.exports = mongoose.model("Video", videoSchema);
