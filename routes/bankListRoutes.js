const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getBanks,
  getBankById,
  createBank,
  updateBank,
  deleteBank,
} = require("../controllers/bankListController.js");

const router = express.Router();

const uploadDir = "uploads/bank_qr";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PNG/JPG images are allowed for QR codes"), false);
  },
});

// Routes
router.get("/", getBanks);
router.get("/:id", getBankById);
router.post("/", upload.single("qrCode"), createBank);
router.put("/:id", upload.single("qrCode"), updateBank);
router.delete("/:id", deleteBank);

module.exports = router;
