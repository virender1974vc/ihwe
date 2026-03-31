const express = require("express");
const router = express.Router();
const galleryController = require("../controllers/portfolioGalleryController");

router.get("/all", galleryController.getAllGallery);
router.post("/create", galleryController.createGallery);
router.post("/add-images", galleryController.addImages);
router.delete("/delete/:id", galleryController.deleteGallery);

module.exports = router;
