const ActivityLog = require("../models/activity/activityLogModel");
const { cleanText, formatDetails } = require("./activityLogFormatter");

const logActivity = async (req, action, module, details) => {
  try {
    const user_id = req.user?.id || req.user?._id;
    const user = cleanText(
      req.body?.updated_by ||
        req.body?.added_by ||
        req.body?.created_by ||
        req.body?.userName ||
        req.body?.user ||
        req.user?.fullName ||
        req.user?.user_fullname ||
        req.user?.name ||
        req.user?.username,
      "System",
    );
    const ip_address = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";

    await ActivityLog.create({
      user_id,
      user,
      action: cleanText(action, "Activity"),
      module: cleanText(module, "System"),
      details: formatDetails(details),
      ip_address,
    });
  } catch (error) {
    console.error("Logger Error:", error.message);
  }
};

module.exports = { logActivity };
