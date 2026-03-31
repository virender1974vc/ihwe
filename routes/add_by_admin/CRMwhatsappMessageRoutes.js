const express = require("express");
const {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
} = require("../../controllers/add_by_admin/CRMwhatsappMessageController.js");
const upload = require("../../middlewares/upload.js");

const router = express.Router();

router.get("/", getAllMessages);
router.get("/:id", getMessageById);

// 🟢 Create new message (with file upload)
router.post("/", upload.single("file_attach"), createMessage);

// 🟢 Update existing message (with file upload)
router.put("/:id", upload.single("file_attach"), updateMessage);

router.delete("/:id", deleteMessage);

module.exports = router;
