const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadMiddleware = require("../middlewares/upload.js");
const {
  addCompany,
  getCompanies,
  getCompanyStatsSummary,
  getCompanyById,
  addCompanyToEvent,
  assignEventsToCompany,
  bulkAssignCompanies,
  updateEventLifecycle,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
  uploadUdyamCertificate,
  uploadContactPhoto,
  uploadCompanies,
  getConvertedCompanies,
  getBookedCompanies,
  getHotLeadCompanies,
} = require("../controllers/companyController.js");

const router = express.Router();

// ─── Server-Side Cache for /api/companies ─────────────────────────────────────
// Keyed by "username:role:dashboard" so each user gets correct scoped data.
// TTL 90 seconds — fresh enough for CRM, massively reduces DB load.
const _companiesCache = new Map();
const COMPANIES_TTL = 90 * 1000; // 90 seconds

const getCompanyCacheKey = (req) => {
  const { username = '', role = '', dashboard = '', eventId = '' } = req.query;
  return `${username.toLowerCase()}:${role.toLowerCase()}:${dashboard}:${eventId}`;
};
const clearCompaniesCache = () => _companiesCache.clear();
// ─────────────────────────────────────────────────────────────────────────────

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

const udyamCertStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/udyam_certificates');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `udyam-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });
const contactUpload = multer({ storage: contactPhotoStorage });
const udyamCertUpload = multer({ storage: udyamCertStorage });

// GET /api/companies — cached ONLY for dashboard calls (where it's heavy and unpaginated)
router.get("/", async (req, res) => {
  if (req.query.dashboard !== 'true') {
    // Standard paginated list call — do NOT cache, rely on fast DB queries
    return getCompanies(req, res);
  }

  const key = getCompanyCacheKey(req);
  const cached = _companiesCache.get(key);
  if (cached && (Date.now() - cached.at) < COMPANIES_TTL) {
    // Instant response from memory — zero DB hit
    return res.status(200).json(cached.data);
  }
  // Cache miss: intercept response to populate cache
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200) {
      _companiesCache.set(key, { data: body, at: Date.now() });
    }
    return originalJson(body);
  };
  return getCompanies(req, res);
});

router.get("/achievement-revenue", require("../controllers/companyController.js").getAchievementRevenue);
router.get("/leaderboard", require("../controllers/companyController.js").getSalesLeaderboard);
router.get("/stats-summary", getCompanyStatsSummary);
router.get("/converted", getConvertedCompanies);
router.get("/booked", getBookedCompanies);
router.get("/hot-leads", getHotLeadCompanies);
router.get("/lookup/:id", require("../controllers/companyController.js").lookupCompanyOrExhibitor);
router.get("/:id", getCompanyById);

// Write routes — always clear cache so next GET reflects latest data
router.post("/", (req, res) => { clearCompaniesCache(); addCompany(req, res); });
router.put("/:id", (req, res) => { clearCompaniesCache(); updateCompany(req, res); });
router.put("/:id/events/:eventId/lifecycle", (req, res) => {
  clearCompaniesCache();
  updateEventLifecycle(req, res);
});
router.delete("/:id", (req, res) => { clearCompaniesCache(); deleteCompany(req, res); });
router.post("/:id/add-to-event", (req, res) => { clearCompaniesCache(); addCompanyToEvent(req, res); });
router.post("/:id/assign-events", (req, res) => { clearCompaniesCache(); assignEventsToCompany(req, res); });
router.post("/bulk-assign", (req, res) => { clearCompaniesCache(); bulkAssignCompanies(req, res); });
router.post("/:id/logo", upload.single("companyLogo"), (req, res) => { clearCompaniesCache(); uploadCompanyLogo(req, res); });
router.post("/:id/udyam-certificate", udyamCertUpload.single("udyamCertificate"), (req, res) => { clearCompaniesCache(); uploadUdyamCertificate(req, res); });
router.post("/:id/contact-photo", contactUpload.single("contactPhoto"), uploadContactPhoto);
router.post(
  "/upload-companies",
  uploadMiddleware.single("file"),
  (req, res) => { clearCompaniesCache(); uploadCompanies(req, res); }
);

module.exports = router;
