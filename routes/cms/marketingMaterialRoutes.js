const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const marketingMaterialController = require('../../controllers/cms/marketingMaterialController');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const fs = require('fs');

const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/marketing-materials';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({ storage: localDiskStorage });
router.get("/", marketingMaterialController.getAllMaterials);
router.post("/", upload.single("file"), marketingMaterialController.createMaterial);
router.put("/:id", upload.single("file"), marketingMaterialController.updateMaterial);
router.delete("/:id", marketingMaterialController.deleteMaterial);
router.post("/share", marketingMaterialController.shareMaterials);
router.get("/history/:cmpny_id", marketingMaterialController.getShareHistory);

module.exports = router;
