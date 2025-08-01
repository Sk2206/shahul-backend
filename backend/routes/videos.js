// backend/routes/videos.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Video = require("../models/Video");

// Create uploads/videos and uploads/thumbnails directories if not exist
const videoDir = path.join(__dirname, "../uploads/videos");
const thumbDir = path.join(__dirname, "../uploads/thumbnails");
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

// Multer setup for video and thumbnail uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith("video");
    cb(null, isVideo ? videoDir : thumbDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// @route   POST /api/videos/upload
// @desc    Upload a new video
router.post("/upload", upload.fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }
]), async (req, res) => {
  try {
    // ✅ Fix: Extract visibility from req.body
    const { title, creator, visibility } = req.body;

    if (!req.files.video || !req.files.thumbnail) {
      return res.status(400).json({ message: "Video and thumbnail are required" });
    }

    const videoPath = `/uploads/videos/${req.files.video[0].filename}`;
    const thumbnailPath = `/uploads/thumbnails/${req.files.thumbnail[0].filename}`;

    const newVideo = new Video({
      title,
      creator,
      videoUrl: videoPath,
      thumbnail: thumbnailPath,
      visibility, // ✅ This will now be stored correctly
    });

    await newVideo.save();
    res.status(201).json({ message: "Video uploaded successfully", video: newVideo });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Server error during upload" });
  }
});


// @route   GET /api/videos/creator/:id
// @desc    Get videos by creator
router.get("/creator/:id", async (req, res) => {
  try {
    const videos = await Video.find({ creator: req.params.id });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});

// @route   GET /api/videos/free
// @desc    Get all videos with visibility = "free"
router.get("/free", async (req, res) => {
  try {
    const freeVideos = await Video.find({ visibility: "free" });
    res.json(freeVideos);
  } catch (err) {
    console.error("Error fetching free videos:", err);
    res.status(500).json({ message: "Server error fetching free videos" });
  }
});

router.get("/", async (req, res) => {
  try {
    const videos = await Video.find().populate("creator", "name email");
    res.json({ videos }); // ✅ Must be wrapped in an object
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});


module.exports = router;
