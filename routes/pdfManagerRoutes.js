const express = require("express");
const router = express.Router();
const pdfController = require("../controllers/pdfManagerController");

router.get("/", pdfController.getAllPdfs);
router.post("/", pdfController.createPdf);
router.put("/:id", pdfController.updatePdf);
router.delete("/:id", pdfController.deletePdf);

module.exports = router;
