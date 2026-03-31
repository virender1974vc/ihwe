const CrmEvent = require("../models/CrmEvent.js");

// 📍 GET All Events
const getAllEvents = async (req, res) => {
  try {
    const events = await CrmEvent.find().sort({ added: -1 });
    res.json(events);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching events", error: err.message });
  }
};

// 📍 GET Single Event by ID
const getEventById = async (req, res) => {
  try {
    const event = await CrmEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching event", error: err.message });
  }
};

// 📍 CREATE Event
const createEvent = async (req, res) => {
  try {
    const newEvent = new CrmEvent(req.body);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating event", error: err.message });
  }
};

// 📍 UPDATE Event
const updateEvent = async (req, res) => {
  try {
    const event = await CrmEvent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating event", error: err.message });
  }
};

// 📍 DELETE Event
const deleteEvent = async (req, res) => {
  try {
    const event = await CrmEvent.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting event", error: err.message });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
