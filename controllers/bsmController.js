const mongoose = require("mongoose");
const BSMMeeting = require("../models/BSMMeeting");
const BuyerRegistration = require("../models/BuyerRegistration");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
exports.getMatchmakingBuyers = async (req, res) => {
  try {
    const { search = '', primaryCategory = '', secondaryCategory = '', page = 1, limit = 20 } = req.query;

    const query = { matchmakingInterest: "Yes" };
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }
    if (primaryCategory) query.primaryProductInterest = primaryCategory;
    if (secondaryCategory) query.secondaryProductCategories = secondaryCategory;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await BuyerRegistration.countDocuments(query);
    const buyers = await BuyerRegistration.find(query)
      .select("companyName designation businessType primaryProductInterest secondaryProductCategories country stateProvince city registrationId")
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

exports.getMatchmakingExhibitors = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const query = { status: { $in: ["paid", "confirmed", "advance-paid"] } };
    if (search) {
      query.$or = [
        { exhibitorName: { $regex: search, $options: 'i' } },
        { industrySector: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ExhibitorRegistration.countDocuments(query);
    const exhibitors = await ExhibitorRegistration.find(query)
      .select("exhibitorName contact1 typeOfBusiness industrySector country registrationId")
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: exhibitors,
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
      .populate("buyerId", "companyName registrationId")
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
    console.log("Fetching meetings for exhibitor ID:", exhibitorId);

    // 1. Find the current registration to get email/mobile
    const currentReg = await ExhibitorRegistration.findById(exhibitorId);
    if (!currentReg) {
      return res.status(404).json({ success: false, message: "Exhibitor not found" });
    }

    // 2. Find all registrations with same email or mobile
    const allRegs = await ExhibitorRegistration.find({
      $or: [
        { 'contact1.email': currentReg.contact1?.email },
        { 'contact1.mobile': currentReg.contact1?.mobile }
      ]
    }).select("_id");

    const regIds = allRegs.map(r => r._id);
    console.log(`Found ${regIds.length} related registrations for email ${currentReg.contact1?.email}`);

    // 3. Find meetings for any of these registrations
    const meetings = await BSMMeeting.find({
      exhibitorId: { $in: regIds }
    })
      .populate("buyerId", "companyName fullName designation registrationId country primaryProductInterest")
      .sort({ date: 1, timeSlot: 1 });

    console.log(`Found ${meetings.length} meetings for exhibitor ${exhibitorId} (across all registrations)`);
    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    console.error("Fetch Exhibitor Meetings Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exhibitorRequestMeeting = async (req, res) => {
  try {
    const { exhibitorId, buyerId, date, timeSlot, remarks, eventId } = req.body;

    let normalizedDate = null;
    if (date) {
      normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
    }

    console.log("Exhibitor Requesting Meeting (Interest):", { exhibitorId, buyerId, date, timeSlot });


    const existing = await BSMMeeting.findOne({
      exhibitorId,
      buyerId,
      eventId: eventId || null,
      status: "Pending"
    });

    if (existing && !existing.date) {
      return res.status(400).json({ success: false, message: "Interest already registered. Awaiting Admin assignment." });
    }

    const meeting = await BSMMeeting.create({
      exhibitorId,
      buyerId,
      date: normalizedDate,
      timeSlot: timeSlot || null,
      remarks,
      eventId: eventId || null,
      status: "Pending",
      requestedBy: "Exhibitor",
      exhibitorApproval: "Approved",
      buyerApproval: "Pending"
    });

    console.log("Interest Registered with ID:", meeting._id);
    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    console.error("Exhibitor Request Error:", error);
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

exports.buyerGetMyMeetings = async (req, res) => {
  try {
    const { buyerId } = req.params;
    console.log("Fetching meetings for buyer ID:", buyerId);

    // 1. Find the current registration to get email/mobile
    const currentReg = await BuyerRegistration.findById(buyerId);
    if (!currentReg) {
      return res.status(404).json({ success: false, message: "Buyer not found" });
    }

    // 2. Find all registrations with same email or mobile
    const allRegs = await BuyerRegistration.find({
      $or: [
        { email: currentReg.email },
        { mobile: currentReg.mobile }
      ]
    }).select("_id");

    const regIds = allRegs.map(r => r._id);
    console.log(`Found ${regIds.length} related buyer registrations`);

    // 3. Find meetings for any of these registrations
    const meetings = await BSMMeeting.find({
      buyerId: { $in: regIds }
    })
      .populate("exhibitorId", "exhibitorName contact1 registrationId country industrySector exhibitorCategory companyLogo profileImage")
      .sort({ date: 1, timeSlot: 1 });

    console.log(`Found ${meetings.length} meetings for buyer ${buyerId} (across all registrations)`);
    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    console.error("Fetch Buyer Meetings Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.buyerRequestMeeting = async (req, res) => {
  try {
    const { buyerId, exhibitorId, date, timeSlot, remarks, eventId } = req.body;

    let normalizedDate = null;
    if (date) {
      normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
    }

    console.log("Buyer Requesting Meeting (Interest):", { buyerId, exhibitorId, date, timeSlot });

    const existing = await BSMMeeting.findOne({
      exhibitorId,
      buyerId,
      eventId: eventId || null,
      status: "Pending"
    });

    if (existing && !existing.date) {
      return res.status(400).json({ success: false, message: "Interest already registered. Awaiting Admin assignment." });
    }

    const meeting = await BSMMeeting.create({
      exhibitorId,
      buyerId,
      date: normalizedDate,
      timeSlot: timeSlot || null,
      remarks,
      eventId: eventId || null,
      status: "Pending",
      requestedBy: "Buyer",
      buyerApproval: "Approved",
      exhibitorApproval: "Pending"
    });

    console.log("Interest Registered with ID:", meeting._id);
    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    console.error("Buyer Request Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.buyerRespondMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { approval } = req.body;

    if (!["Approved", "Rejected"].includes(approval)) {
      return res.status(400).json({ success: false, message: "Invalid approval value" });
    }

    const meeting = await BSMMeeting.findById(id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    meeting.buyerApproval = approval;
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

exports.getExhibitorCategories = async (req, res) => {
  try {
    const sectors = await ExhibitorRegistration.distinct("industrySector", { status: { $in: ["paid", "confirmed", "advance-paid"] } });
    res.status(200).json({ success: true, sectors: sectors.filter(Boolean).sort() });
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