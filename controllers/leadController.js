const IndividualLead = require("../models/IndividualLead");
const CorporateLead = require("../models/CorporateLead");

// 🟢 Get all individual leads
exports.getIndividualLeads = async (req, res) => {
  try {
    const { search = "", status = "All" } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
        { emailAddress: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    if (status !== "All") {
      query.status = status;
    }

    const leads = await IndividualLead.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Create individual lead
exports.createIndividualLead = async (req, res) => {
  try {
    const lead = new IndividualLead(req.body);
    await lead.save();
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Update lead
exports.updateIndividualLead = async (req, res) => {
  try {
    const lead = await IndividualLead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Delete lead
exports.deleteIndividualLead = async (req, res) => {
  try {
    await IndividualLead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔵 Get all corporate leads
exports.getCorporateLeads = async (req, res) => {
  try {
    const { search = "", status = "all" } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }
    if (status !== "all") query.status = status;

    const leads = await CorporateLead.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔵 Create corporate lead
exports.createCorporateLead = async (req, res) => {
  try {
    const lead = new CorporateLead(req.body);
    await lead.save();
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔵 Update corporate lead
exports.updateCorporateLead = async (req, res) => {
  try {
    const lead = await CorporateLead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔵 Delete corporate lead
exports.deleteCorporateLead = async (req, res) => {
  try {
    await CorporateLead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
