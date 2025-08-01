// backend/routes/creator.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Video = require("../models/Video");
const { verifyCreator } = require("../middleware/authMiddleware");

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    cb(null, isImage ? "uploads/thumbnails" : "uploads/videos");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Upload video
router.post(
  "/upload",
  verifyCreator,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description, tags, visibility } = req.body;
      const newVideo = new Video({
        title,
        description,
        tags: tags.split(",").map((t) => t.trim()),
        visibility,
        thumbnailUrl: `/uploads/thumbnails/${req.files.thumbnail[0].filename}`,
        filePath: `/uploads/videos/${req.files.video[0].filename}`,
        creator: req.user.id,
      });
      await newVideo.save();
      res.status(201).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

// Get my videos
router.get("/my-videos", verifyCreator, async (req, res) => {
  try {
    const videos = await Video.find({ creator: req.user.id });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});

// Delete video
router.delete("/delete/:id", verifyCreator, async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: "Video deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
