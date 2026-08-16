const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const controller = require("../controllers/deliveryChallanController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/delivery-challans");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-z0-9_-]/gi, "-");
    cb(null, `${Date.now()}-${safeBase}${path.extname(file.originalname).toLowerCase()}`);
  },
});
const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ["application/pdf", "image/png", "image/jpeg"].includes(file.mimetype)),
});
const uploadAttachment = (req, res, next) => {
  attachmentUpload.single("attachment")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "The file must be 25MB or smaller." });
    }
    return res.status(400).json({ message: error.message || "Unable to upload attachment." });
  });
};

router.get("/proformas/:companyId", controller.getProformaOptions);
router.get("/overview", controller.getChallansOverview);
router.get("/", controller.getChallans);
router.get("/:id", controller.getChallan);
router.post("/", controller.createChallan);
router.put("/:id", controller.updateChallan);
router.post("/:id/attachment", uploadAttachment, controller.uploadAttachment);
router.delete("/:id", controller.deleteChallan);
router.get("/:id/preview-whatsapp", controller.previewWhatsApp);
router.post("/:id/send-whatsapp", controller.sendWhatsApp);
router.get("/:id/preview-email", controller.previewEmail);
router.post("/:id/send-email", controller.sendEmail);

module.exports = router;
