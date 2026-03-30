const ActivityLog = require("../../models/activity/activityLogModel");

// ➤ Private IP check helper
const isPrivateIp = (ip) => {
  return (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.") ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost"
  );
};

// ➤ IP extract helper
const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    const publicIp = forwarded
      .split(",")
      .map((ip) => ip.trim())
      .find((ip) => !isPrivateIp(ip));

    if (publicIp) return publicIp;
  }

  return (
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    ""
  );
};

// CREATE
const createActivityLog = async (req, res) => {
  try {
    const { user_id, message, link, section, data } = req.body;

    if (!user_id || !message || !section) {
      return res.status(400).json({
        success: false,
        message: "user_id, message and section are required",
      });
    }

    const log = await ActivityLog.create({
      user_id,
      message,
      link: link || "",
      section,
      data: data || {},
      ip_address: getClientIp(req),
    });

    res.status(201).json({
      success: true,
      message: "Activity log created successfully",
      data: log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL
const getAllActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET BY ID
const getActivityLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Activity log not found",
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE
const deleteActivityLog = async (req, res) => {
  try {
    const log = await ActivityLog.findByIdAndDelete(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Activity log not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activity log deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  createActivityLog,
  getAllActivityLogs,
  getActivityLogById,
  deleteActivityLog,
};
