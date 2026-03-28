const WhatsAppMessage = require("../../models/add_by_admin/CRMWhatsAppMessage");
const path = require("path");

// 🟢 Get all messages
const getAllMessages = async (req, res) => {
  try {
    const messages = await WhatsAppMessage.find().sort({ msg_added: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching messages",
      error: err.message,
    });
  }
};

// 🟢 Get single message by ID
const getMessageById = async (req, res) => {
  try {
    const message = await WhatsAppMessage.findById(req.params.id);

    if (!message) return res.status(404).json({ message: "Message not found" });

    res.json(message);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching message",
      error: err.message,
    });
  }
};

// 🟢 Create new WhatsApp message
const createMessage = async (req, res) => {
  try {
    const { msg_name, msg_descr, msg_status } = req.body;

    const filePath = req.file
      ? `/uploads/whatsapp_files/${req.file.filename}`
      : "N/A";

    const newMessage = new WhatsAppMessage({
      msg_name,
      msg_descr,
      msg_status,
      file_attach: filePath,
    });

    const savedMsg = await newMessage.save();

    res.status(201).json(savedMsg);
  } catch (err) {
    res.status(500).json({
      message: "Error creating message",
      error: err.message,
    });
  }
};

// 🟢 Update message
const updateMessage = async (req, res) => {
  try {
    const { msg_name, msg_descr, msg_status } = req.body;

    const filePath = req.file
      ? `/uploads/whatsapp_files/${req.file.filename}`
      : undefined;

    const updatedData = {
      msg_name,
      msg_descr,
      msg_status,
    };

    if (filePath) updatedData.file_attach = filePath;

    const updatedMsg = await WhatsAppMessage.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true },
    );

    if (!updatedMsg)
      return res.status(404).json({ message: "Message not found" });

    res.json({
      message: "Message updated successfully",
      data: updatedMsg,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating message",
      error: err.message,
    });
  }
};

// 🟢 Delete message
const deleteMessage = async (req, res) => {
  try {
    const deletedMsg = await WhatsAppMessage.findByIdAndDelete(req.params.id);

    if (!deletedMsg)
      return res.status(404).json({ message: "Message not found" });

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting message",
      error: err.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
};
