const ActivityLog = require('../models/misc/activityLogModel');
const logActivity = async (req, action, module, details) => {
  try {
    const user_id = req.user?.id || req.user?._id;
    const user = req.user?.username || "System";
    const ip_address = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";

    await ActivityLog.create({
      user_id,
      user,
      action,
      module,
      details,
      ip_address,
    });
  } catch (error) {
    console.error("Logger Error:", error.message);
  }
};

module.exports = { logActivity };
