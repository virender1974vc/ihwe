const express = require("express");
const router = express.Router();
const Company = require("../models/Company");

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GET /api/crm-follow-ups
 * Returns all companies (across all lead statuses) that have a followUpDate set.
 * Supports: eventId, username, role, status, startDate, endDate, search
 */
router.get("/", async (req, res) => {
  try {
    const { eventId, username, role, startDate, endDate, search } = req.query;

    // Base: must have a followUpDate set (either in eventAssignments or root)
    let query = {};

    if (eventId) {
      // For event-scoped: pick companies assigned to this event with a followUpDate
      query["eventAssignments"] = {
        $elemMatch: {
          eventId,
          followUpDate: { $exists: true, $ne: null },
        },
      };
    } else {
      // For all-events view: any company with followUpDate set
      query["$or"] = [
        { followUpDate: { $exists: true, $ne: null } },
        { "eventAssignments.followUpDate": { $exists: true, $ne: null } },
      ];
    }

    // Date range filter on followUpDate
    if (startDate || endDate) {
      const dateRange = {};
      if (startDate) dateRange.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateRange.$lte = end;
      }
      if (eventId) {
        query["eventAssignments"] = {
          $elemMatch: {
            eventId,
            followUpDate: dateRange,
          },
        };
      } else {
        query["$or"] = [
          { followUpDate: dateRange },
          { "eventAssignments.followUpDate": dateRange },
        ];
      }
    }

    // Authorization scope
    const lowerUsername = username ? username.toLowerCase() : null;
    const cleanRole = role ? role.toLowerCase().replace(/[^a-z]/g, "") : "";
    const isSuperAdmin = cleanRole.includes("superadmin");

    if (lowerUsername && !isSuperAdmin) {
      let lowerFullName = lowerUsername;
      try {
        const User = require("../models/User");
        const adminUser = await User.findOne({
          username: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, "i") },
        });
        if (adminUser && adminUser.fullName) {
          lowerFullName = adminUser.fullName.toLowerCase();
        }
      } catch (e) { console.error(e); }

      const userIdentities = [lowerUsername];
      if (lowerFullName !== lowerUsername) userIdentities.push(lowerFullName);
      const userRegexes = userIdentities.map((id) => new RegExp(`^${escapeRegex(id)}$`, "i"));

      const assignedFilter = eventId
        ? { "eventAssignments": { $elemMatch: { eventId, forwardTo: { $in: userRegexes } } } }
        : { forwardTo: { $in: userRegexes } };

      if (query.$and) {
        query.$and.push({ $or: [assignedFilter, { added_by: { $in: userRegexes } }] });
      } else if (query.$or) {
        query = {
          $and: [{ $or: query.$or }, { $or: [assignedFilter, { added_by: { $in: userRegexes } }] }],
        };
      } else {
        query.$or = [assignedFilter, { added_by: { $in: userRegexes } }];
      }
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      const searchOr = [
        { companyName: searchRegex },
        { email: searchRegex },
        { "contacts.mobile": searchRegex },
        { "contacts.firstName": searchRegex },
        { "contacts.name": searchRegex },
      ];
      if (query.$and) {
        query.$and.push({ $or: searchOr });
      } else if (query.$or) {
        query = { $and: [{ $or: query.$or }, { $or: searchOr }] };
      } else {
        query.$or = searchOr;
      }
    }

    const companies = await Company.find(query)
      .select("companyName businessNature category city state contacts followUpDate reminder forwardTo companyStatus added_by eventAssignments updatedAt")
      .sort({ updatedAt: -1, followUpDate: -1 })
      .limit(500)
      .lean();

    // Map to reminder-friendly format
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

    const reminders = companies.map((company) => {
      // If eventId, find the specific assignment
      let assignment = null;
      if (eventId) {
        assignment = (company.eventAssignments || []).find(
          (a) => String(a.eventId) === String(eventId) && a.followUpDate
        );
      } else {
        // Find the latest assignment with a followUpDate
        assignment = (company.eventAssignments || [])
          .filter((a) => a.followUpDate)
          .sort((a, b) => new Date(b.followUpDate) - new Date(a.followUpDate))[0];
      }

      const followUpDate = assignment?.followUpDate || company.followUpDate;
      const assignedTo = assignment?.forwardTo || company.forwardTo || "";
      const status = assignment?.status || company.companyStatus || "New Lead";
      const lastRemark = assignment?.lastRemark || "";

      // Extract clean remark text if formatted as audit log
      let cleanRemark = lastRemark;
      if (lastRemark && lastRemark.includes("• Remark:")) {
        const parts = lastRemark.split("• Remark:");
        if (parts[1]) cleanRemark = parts[1].trim();
      }

      // Extract Next Action
      let nextAction = assignment?.nextAction || company.nextAction || "";
      if (!nextAction && lastRemark && lastRemark.includes("• Next action:")) {
        const match = lastRemark.match(/• Next action:\s*([^•\n]+)/);
        if (match && match[1]) {
          nextAction = match[1].trim();
        }
      }

      // Determine follow-up type from lastRemark, nextAction or status
      let followUpType = nextAction || "Call Follow-Up";
      const remarkLower = (lastRemark || "").toLowerCase();
      const statusLower = (status || "").toLowerCase();
      if (!nextAction) {
        if (remarkLower.includes("whatsapp") || statusLower.includes("whatsapp")) followUpType = "Whatsapp Follow-Up";
        else if (remarkLower.includes("meeting") || statusLower.includes("meeting")) followUpType = "Meeting Follow-Up";
        else if (remarkLower.includes("email") || statusLower.includes("email")) followUpType = "Email Follow-Up";
      }

      // Determine reminder status
      let reminderStatus = "Pending";
      if (followUpDate) {
        const fDate = new Date(followUpDate);
        if (fDate < todayStart) reminderStatus = "Overdue";
        else if (fDate >= todayStart && fDate <= todayEnd) {
          // If status is Booked/Converted/Completed, mark completed
          if (["Booked", "Converted", "Completed"].some(s => statusLower.includes(s.toLowerCase()))) {
            reminderStatus = "Completed";
          }
        }
      }
      if (["Booked", "Converted"].some(s => statusLower.includes(s.toLowerCase()))) {
        reminderStatus = "Completed";
      }

      const primaryContact = (company.contacts || [])[0] || {};
      const contactName = primaryContact.firstName
        ? `${primaryContact.firstName || ""} ${primaryContact.surname || ""}`.trim()
        : primaryContact.name || "";

      let dateStr = "";
      let timeStr = "";
      if (followUpDate) {
        const d = new Date(followUpDate);
        dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
      }

      const updateTimestamp = assignment?.updatedAt || company.updatedAt || company.updated_at || followUpDate;

      return {
        id: company._id,
        companyId: company._id,
        company: company.companyName,
        industry: company.businessNature || company.category || "General",
        city: company.city || company.state || "",
        leadName: contactName,
        mobile: primaryContact.mobile || "",
        email: primaryContact.email || company.email || "",
        type: followUpType,
        nextAction: nextAction || followUpType,
        date: dateStr,
        time: timeStr,
        followUpDate: followUpDate,
        updatedAt: updateTimestamp,
        assignedTo: assignedTo,
        assignedRole: "",
        status: reminderStatus,
        priority: reminderStatus === "Overdue" ? "High" : (reminderStatus === "Completed" ? "Low" : "Medium"),
        currentStatus: status,
        lastRemark: cleanRemark || lastRemark,
        rawRemark: lastRemark,
      };
    })
      .filter((r) => r.followUpDate)
      .sort((a, b) => {
        const tA = new Date(a.updatedAt || a.followUpDate).getTime() || 0;
        const tB = new Date(b.updatedAt || b.followUpDate).getTime() || 0;
        return tB - tA;
      });

    res.json({ success: true, data: reminders, total: reminders.length });
  } catch (error) {
    console.error("Error fetching CRM follow-ups:", error);
    res.status(500).json({ success: false, message: "Error fetching follow-ups", error: error.message });
  }
});

/**
 * PUT /api/crm-follow-ups/:id/complete
 * Marks a follow-up as Completed for a company so alerts stop.
 */
router.put("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }


    const update = { followUpDate: null, followUpStatus: "Completed" };
    if (company.eventAssignments && company.eventAssignments.length > 0) {
      update["eventAssignments.$[].followUpDate"] = null;
      update["eventAssignments.$[].followUpStatus"] = "Completed";
    }

    await Company.updateOne({ _id: id }, { $set: update });
    res.json({ success: true, message: "Follow-up marked as completed" });
  } catch (error) {
    console.error("Error marking follow-up as completed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
