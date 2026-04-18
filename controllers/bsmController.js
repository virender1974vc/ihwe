const BSMMeeting = require("../models/BSMMeeting");
const BuyerRegistration = require("../models/BuyerRegistration");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
exports.getMatchmakingBuyers = async (req, res) => {
  try {
    const { search = '', primaryCategory = '', secondaryCategory = '', page = 1, limit = 20 } = req.query;

    const query = { matchmakingInterest: "Yes" };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }
    if (primaryCategory) query.primaryProductInterest = primaryCategory;
    if (secondaryCategory) query.secondaryProductCategories = secondaryCategory;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await BuyerRegistration.countDocuments(query);
    const buyers = await BuyerRegistration.find(query)
      .select("fullName companyName designation businessType primaryProductInterest secondaryProductCategories country stateProvince city registrationId")
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: buyers,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBuyerCategories = async (req, res) => {
  try {
    const primaryCategories = await BuyerRegistration.distinct("primaryProductInterest", { matchmakingInterest: "Yes" });
    const secondaryRaw = await BuyerRegistration.aggregate([
      { $match: { matchmakingInterest: "Yes" } },
      { $unwind: "$secondaryProductCategories" },
      { $group: { _id: "$primaryProductInterest", subs: { $addToSet: "$secondaryProductCategories" } } },
    ]);
    const subMap = {};
    secondaryRaw.forEach(r => { if (r._id) subMap[r._id] = r.subs.filter(Boolean).sort(); });
    res.status(200).json({ success: true, primaryCategories: primaryCategories.filter(Boolean).sort(), subMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.adminCreateMeeting = async (req, res) => {
  try {
    const { buyerId, exhibitorId, date, timeSlot, location, adminNotes } = req.body;
    const existing = await BSMMeeting.findOne({
      $or: [
        { buyerId, date, timeSlot },
        { exhibitorId, date, timeSlot },
      ],
      status: { $ne: "Cancelled" }
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: "Conflict: One of the participants is already booked for this slot." 
      });
    }

    const meeting = await BSMMeeting.create({
      buyerId,
      exhibitorId,
      date,
      timeSlot,
      location,
      adminNotes,
      status: "Approved",
      requestedBy: "Admin",
      exhibitorApproval: "Approved",
      buyerApproval: "Approved",
    });

    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.adminGetAllMeetings = async (req, res) => {
  try {
    const meetings = await BSMMeeting.find()
      .populate("buyerId", "fullName companyName registrationId")
      .populate("exhibitorId", "exhibitorName registrationId")
      .sort({ date: 1, timeSlot: 1 });
    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.exhibitorGetMyMeetings = async (req, res) => {
  try {
    const { exhibitorId } = req.params;
    const meetings = await BSMMeeting.find({ exhibitorId })
      .populate("buyerId", "fullName companyName designation registrationId country primaryProductInterest")
      .sort({ date: 1, timeSlot: 1 });
    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.exhibitorRequestMeeting = async (req, res) => {
  try {
    const { exhibitorId, buyerId, date, timeSlot, remarks } = req.body;
    const existing = await BSMMeeting.findOne({
      exhibitorId,
      buyerId,
      date,
      timeSlot,
      status: { $ne: "Cancelled" }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Request already exists for this slot." });
    }

    const meeting = await BSMMeeting.create({
      exhibitorId,
      buyerId,
      date,
      timeSlot,
      remarks,
      status: "Pending",
      requestedBy: "Exhibitor"
    });

    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, location } = req.body;

    const meeting = await BSMMeeting.findByIdAndUpdate(
      id,
      { status, adminNotes, location },
      { new: true }
    );

    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.exhibitorRespondMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { approval } = req.body;

    if (!["Approved", "Rejected"].includes(approval)) {
      return res.status(400).json({ success: false, message: "Invalid approval value" });
    }

    const meeting = await BSMMeeting.findById(id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    meeting.exhibitorApproval = approval;
    if (approval === "Rejected") {
      meeting.status = "Rejected";
    } else if (meeting.exhibitorApproval === "Approved" && meeting.buyerApproval === "Approved") {
      meeting.status = "Approved";
    }

    await meeting.save();
    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.adminSetApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { side, approval } = req.body;

    if (!["exhibitor", "buyer"].includes(side)) {
      return res.status(400).json({ success: false, message: "side must be 'exhibitor' or 'buyer'" });
    }
    if (!["Approved", "Rejected"].includes(approval)) {
      return res.status(400).json({ success: false, message: "approval must be 'Approved' or 'Rejected'" });
    }

    const meeting = await BSMMeeting.findById(id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    if (side === "exhibitor") meeting.exhibitorApproval = approval;
    else meeting.buyerApproval = approval;
    if (approval === "Rejected") {
      meeting.status = "Rejected";
    } else if (meeting.exhibitorApproval === "Approved" && meeting.buyerApproval === "Approved") {
      meeting.status = "Approved";
    } else {
      meeting.status = "Pending";
    }

    await meeting.save();
    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};