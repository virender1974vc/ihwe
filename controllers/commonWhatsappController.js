const CommonWhatsapp = require("../models/CommonWhatsapp");

// ➤ Get all WhatsApp records
const getWhatsappRecords = async (req, res) => {
  try {
    const records = await CommonWhatsapp.find();
    res.status(200).json({
      message: "WhatsApp records fetched successfully",
      data: records,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching WhatsApp records",
      error: err.message,
    });
  }
};

// ➤ Get record by ID
const getWhatsappRecordById = async (req, res) => {
  try {
    const record = await CommonWhatsapp.findById(req.params.id);
    if (!record)
      return res.status(404).json({ message: "WhatsApp record not found" });

    res.status(200).json({
      message: "WhatsApp record fetched successfully",
      data: record,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching WhatsApp record",
      error: err.message,
    });
  }
};

// ➤ Create new record
const createWhatsappRecord = async (req, res) => {
  try {
    const {
      compny_id,
      phone_no,
      whtsapp_title,
      whtsapp_desc,
      sent_files_img,
      user,
    } = req.body;

    const newRecord = new CommonWhatsapp({
      compny_id,
      phone_no,
      whtsapp_title,
      whtsapp_desc,
      sent_files_img,
      user,
      added: new Date(),
    });

    const savedRecord = await newRecord.save();

    res.status(201).json({
      message: "WhatsApp record created successfully",
      data: savedRecord,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating WhatsApp record",
      error: err.message,
    });
  }
};

// ➤ Update record
const updateWhatsappRecord = async (req, res) => {
  try {
    const updates = req.body || {};

    const record = await CommonWhatsapp.findById(req.params.id);
    if (!record)
      return res.status(404).json({ message: "WhatsApp record not found" });

    const allowedFields = [
      "compny_id",
      "phone_no",
      "whtsapp_title",
      "whtsapp_desc",
      "sent_files_img",
      "user",
    ];

    allowedFields.forEach((key) => {
      if (updates[key] !== undefined) record[key] = updates[key];
    });

    record.updated = new Date();
    const savedRecord = await record.save();

    res.status(200).json({
      message: "WhatsApp record updated successfully",
      data: savedRecord,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating WhatsApp record",
      error: err.message,
    });
  }
};

// ➤ Delete record
const deleteWhatsappRecord = async (req, res) => {
  try {
    const deletedRecord = await CommonWhatsapp.findByIdAndDelete(req.params.id);

    if (!deletedRecord)
      return res.status(404).json({ message: "WhatsApp record not found" });

    res.status(200).json({
      message: "WhatsApp record deleted successfully",
      data: deletedRecord,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting WhatsApp record",
      error: err.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  getWhatsappRecords,
  getWhatsappRecordById,
  createWhatsappRecord,
  updateWhatsappRecord,
  deleteWhatsappRecord,
};
