const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadMiddleware = require("../middlewares/upload.js");
const {
  addCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
  uploadContactPhoto,
  uploadCompanies,
} = require("../controllers/companyController.js");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/company_logos');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const contactPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/contact_photos');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `contact-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });
const contactUpload = multer({ storage: contactPhotoStorage });

router.post("/", addCompany);
router.get("/", getCompanies);
router.get("/:id", getCompanyById);
router.put("/:id", updateCompany);
router.delete("/:id", deleteCompany);
router.post("/:id/logo", upload.single("companyLogo"), uploadCompanyLogo);
router.post("/:id/contact-photo", contactUpload.single("contactPhoto"), uploadContactPhoto);
router.post(
  "/upload-companies",
  uploadMiddleware.single("file"),
  uploadCompanies
);
module.exports = router;
