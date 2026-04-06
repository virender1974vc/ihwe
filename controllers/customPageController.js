const CustomPage = require("../models/CustomPage");
const { logActivity } = require("../utils/logger");

exports.getAllPages = async (req, res) => {
  try {
    const pages = await CustomPage.find().sort({ createdAt: -1 });
    res.json({ success: true, data: pages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPageBySlugOrId = async (req, res) => {
  try {
    const page = await CustomPage.findOne({
      $or: [{ slug: req.params.slugOrId }, { _id: (req.params.slugOrId.match(/^[0-9a-fA-F]{24}$/) ? req.params.slugOrId : null) }]
    });
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPage = async (req, res) => {
  try {
    const page = await CustomPage.create(req.body);
    await logActivity(req, 'Created', 'CustomPage', `Created new page: ${req.body.title}`);
    res.status(201).json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const page = await CustomPage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    await logActivity(req, 'Updated', 'CustomPage', `Updated page: ${req.body.title || page.title}`);
    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const page = await CustomPage.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    await logActivity(req, 'Deleted', 'CustomPage', `Deleted page ID: ${req.params.id}`);
    res.json({ success: true, message: "Page deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
