const router = require("express").Router();
const controller = require("../controllers/deliveryChallanController");

router.get("/proformas/:companyId", controller.getProformaOptions);
router.get("/", controller.getChallans);
router.get("/:id", controller.getChallan);
router.post("/", controller.createChallan);
router.put("/:id", controller.updateChallan);
router.delete("/:id", controller.deleteChallan);
router.get("/:id/preview-whatsapp", controller.previewWhatsApp);
router.post("/:id/send-whatsapp", controller.sendWhatsApp);
router.get("/:id/preview-email", controller.previewEmail);
router.post("/:id/send-email", controller.sendEmail);

module.exports = router;
