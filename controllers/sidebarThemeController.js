const SidebarTheme = require("../models/SidebarTheme");

exports.getTheme = async (req, res) => {
  try {
    let theme = await SidebarTheme.findOne().sort({ createdAt: -1 });
    if (!theme) {
      // Default theme if none exists
      return res.json({
        success: true,
        data: {
          bgColor: "#ffffff",
          iconColor: "#2563EB",
          textColor: "#0F2854",
          hoverColor: "#EFF6FF",
          activeColor: "#DBEAFE",
          toggleColor: "#2563EB",
          hamburgerColor: "#000000",
        },
      });
    }
    res.json({ success: true, data: theme });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const theme = await SidebarTheme.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    });
    res.json({ success: true, data: theme });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
