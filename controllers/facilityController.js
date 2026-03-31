const Facility = require("../models/Facility");

exports.getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find().sort({ createdAt: -1 });
    res.json({ success: true, data: facilities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFacility = async (req, res) => {
  try {
    const facility = new Facility(req.body);
    await facility.save();
    res.json({ success: true, data: facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, data: facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFacility = async (req, res) => {
  try {
    await Facility.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
