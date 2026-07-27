const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const floatingVideoController = require("../controllers/floatingVideoController");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token provided" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "ihwe_secret_2026");
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token expired or invalid" });
  }
};

// Multer storage for videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/videos");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `video-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    }
});

// Routes
router.get("/", floatingVideoController.getAllVideos);
router.get("/settings", floatingVideoController.getSettings);

router.post("/", verifyToken, upload.single("video"), floatingVideoController.createVideo);
router.put("/settings", verifyToken, floatingVideoController.updateSettings);
router.put("/:id", verifyToken, upload.single("video"), floatingVideoController.updateVideo);
router.delete("/:id", verifyToken, floatingVideoController.deleteVideo);

module.exports = router;
