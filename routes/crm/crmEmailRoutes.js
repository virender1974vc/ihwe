const express = require("express");
const multer = require("multer");
const { sendCrmEmail } = require('../../controllers/crm/crmEmailController');

const router = express.Router();

// Use memory storage — files go directly as email attachments, no disk write
const upload = multer({ storage: multer.memoryStorage() });

router.post("/send", upload.array("attachments", 10), sendCrmEmail);

module.exports = router;
