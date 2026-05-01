const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const {
  createPlan,
  getPlans,
  getActivePlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getAvailableFeatures,
  uploadPlanImage,
} = require("../../controllers/add_by_admin/SellerSubscriptionPlanController.js");

// ─── Multer Storage Configuration ─────────────────────────────────────────────
const uploadDir = "uploads/subscription-plans";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `plan-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const router = express.Router();

router.post("/", createPlan); // ➤ Add new plan
router.get("/", getPlans); // ➤ Get all plans
router.get("/active", getActivePlans); // ➤ Get active plans for dropdowns
router.get("/features", getAvailableFeatures); // ➤ Get available features list
router.post("/upload-image", upload.single("image"), uploadPlanImage); // ➤ Upload plan image
router.get("/:id", getPlanById); // ➤ Get one plan
router.put("/:id", updatePlan); // ➤ Update plan
router.delete("/:id", deletePlan); // ➤ Delete plan

module.exports = router;
