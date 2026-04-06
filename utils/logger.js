const ActivityLog = require("../models/activity/activityLogModel");

/**
 * Utility to log administrative actions.
 * @param {Object} req - The request object (to extract user and IP)
 * @param {String} action - The action type (Created, Updated, Deleted, Logged In)
 * @param {String} module - The module or section name
 * @param {String} details - Description of the action
 */
const logActivity = async (req, action, module, details) => {
  try {
    const user_id = req.user?.id || req.user?._id;
    const user = req.user?.username || "System";
    
    // Extract IP address
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
