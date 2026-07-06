const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {
  getImprestRequests,
  getImprestRequestById,
  createImprestRequest,
  updateImprestStatus,
} = require("../controllers/imprestController");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads/imprest");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    cb(allowed.includes(file.mimetype) ? null : new Error("Only JPG, PNG and PDF files are allowed"), allowed.includes(file.mimetype));
  },
});

router.get("/", getImprestRequests);
router.get("/:id", getImprestRequestById);
router.post("/", upload.single("attachment"), createImprestRequest);
router.patch("/:id/status", updateImprestStatus);

module.exports = router;
