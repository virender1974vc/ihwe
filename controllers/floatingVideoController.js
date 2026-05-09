const FloatingVideo = require("../models/FloatingVideo");
const Settings = require("../models/Settings");

exports.getAllVideos = async (req, res) => {
  try {
    const videos = await FloatingVideo.find().sort({ order: 1 });
    res.json({ success: true, data: videos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createVideo = async (req, res) => {
  try {
    const { title, name, companyName, companyNameColor, status, order } = req.body;
    let videoUrl = "";
    if (req.file) {
      videoUrl = `/uploads/videos/${req.file.filename}`;
    }
    const video = await FloatingVideo.create({
      title,
      name,
      companyName,
      companyNameColor,
      videoUrl,
      status: status || "active",
      order: order ? Number(order) : 0,
    });
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const { title, name, companyName, companyNameColor, status, order } = req.body;
    const updateData = {
      title,
      name,
      companyName,
      companyNameColor,
      status,
      order: order ? Number(order) : 0,
    };
    if (req.file) {
      updateData.videoUrl = `/uploads/videos/${req.file.filename}`;
    }
    const video = await FloatingVideo.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    await FloatingVideo.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }
    res.json({ success: true, timer: settings.floatingVideoTimer || 7 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { timer } = req.body;
    const settings = await Settings.findOneAndUpdate(
      {},
      { floatingVideoTimer: Number(timer) },
      { new: true, upsert: true }
    );
    res.json({ success: true, timer: settings.floatingVideoTimer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
