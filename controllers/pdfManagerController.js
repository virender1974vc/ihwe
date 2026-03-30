const PdfManager = require("../models/PdfManager");

exports.getAllPdfs = async (req, res) => {
  try {
    const pdfs = await PdfManager.find().sort({ createdAt: -1 });
    res.json({ success: true, data: pdfs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPdf = async (req, res) => {
  try {
    const pdf = await PdfManager.create(req.body);
    res.status(201).json({ success: true, data: pdf });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePdf = async (req, res) => {
  try {
    const pdf = await PdfManager.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pdf) return res.status(404).json({ success: false, message: "PDF not found" });
    res.json({ success: true, data: pdf });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePdf = async (req, res) => {
  try {
    const pdf = await PdfManager.findByIdAndDelete(req.params.id);
    if (!pdf) return res.status(404).json({ success: false, message: "PDF not found" });
    res.json({ success: true, message: "PDF deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
