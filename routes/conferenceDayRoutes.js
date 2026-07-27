const express = require("express");
const router = express.Router();
const conferenceDayController = require("../controllers/conferenceDayController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyToken } = require("../utils/verifyToken");

// Multer storage for conference images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/conference");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `conf-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Public route to get data for a specific day
router.get("/all", conferenceDayController.getAllConferenceDays);
router.get("/:dayNumber", conferenceDayController.getConferenceDay);

// Admin routes
router.post("/upload", upload.single("image"), conferenceDayController.uploadImage);
router.post("/:dayNumber", conferenceDayController.updateConferenceDay);
router.delete("/:dayNumber", conferenceDayController.deleteConferenceDay);
router.post("/seed/initial", conferenceDayController.seedInitialData);

module.exports = router;

