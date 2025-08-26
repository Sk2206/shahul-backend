// server.js (robust / defensive)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

let helmet;
try {
  helmet = require("helmet");
} catch (e) {
  console.warn("helmet not available or ESM-only in this environment. Install helmet or use compatible version if you want headers set automatically.");
}

let rateLimit;
try {
  rateLimit = require("express-rate-limit");
} catch (e) {
  console.warn("express-rate-limit not installed. Install it to enable rate limiting.");
}

const cookieParser = (() => {
  try { return require("cookie-parser"); } catch (e) { return null; }
})();

const authRoutes = require("./routes/auth");
const videoRoutes = require("./routes/videos");
const userRoutes = require("./routes/User");
const adminRoutes = require("./routes/admin");
const paymentAccountsRoute = require("./routes/admin/paymentAccounts");

const app = express();

// Helmet (optional - will be used only if require() worked)
if (helmet) app.use(helmet());

// Rate limiter (if installed)
if (rateLimit) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", limiter);
}

// CORS - allowlist from env or fallback to the domain you shared
const allowed = (process.env.ALLOWED_ORIGINS || "https://nitinshukla.com,http://localhost:3000")
  .split(",")
  .map(s => s.trim());
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // allow curl/postman (no origin)
    if (allowed.includes(origin)) return cb(null, true);
    cb(new Error("CORS policy: origin not allowed"));
  },
  credentials: true,
}));

// Body parsing with size limit
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Cookie parser if available
if (cookieParser) app.use(cookieParser());

// Static uploads (deny dotfiles and disable directory index)
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { dotfiles: "deny", index: false }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "uploads/videos");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/payment-accounts", paymentAccountsRoute);

// Simple health check
app.get("/healthz", (req, res) => res.json({ ok: true }));

// Global error handler (logs stack in server console, returns generic message to client)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && (err.stack || err.message || err));
  res.status(500).json({ error: "Internal Server Error" });
});

// Start only after DB connects (safer)
const PORT = process.env.PORT || 5000;
(async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("ERROR: MONGO_URI not set in environment.");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    // graceful shutdown
    process.on("SIGTERM", () => {
      console.info("SIGTERM received — closing server");
      server.close(() => mongoose.disconnect().then(() => process.exit(0)));
    });
    process.on("SIGINT", () => process.kill(process.pid, "SIGTERM"));
  } catch (err) {
    console.error("Failed to start server:", err && (err.stack || err.message || err));
    process.exit(1);
  }
})();
