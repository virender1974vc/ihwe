const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const partnerRegistrationController = require("../controllers/partnerRegistrationController");

// Multer config for partner documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/partners/documents";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const fieldName = file.fieldname;
    cb(null, `${fieldName}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
});

const uploadFields = upload.fields([
  { name: "companyProfile", maxCount: 1 },
  { name: "gstCertificate", maxCount: 1 },
  { name: "panCard", maxCount: 1 },
  { name: "msmeCertificate", maxCount: 1 },
  { name: "portfolio", maxCount: 1 },
  { name: "visitingCard", maxCount: 1 },
]);

// Public submission route
router.post("/", uploadFields, (req, res) => partnerRegistrationController.submitRegistration(req, res));

// Admin management routes
router.get("/", (req, res) => partnerRegistrationController.getAllRegistrations(req, res));
router.get("/:id", (req, res) => partnerRegistrationController.getRegistrationById(req, res));
router.patch("/:id/status", (req, res) => partnerRegistrationController.updateStatus(req, res));

module.exports = router;
