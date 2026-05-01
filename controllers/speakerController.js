const Speaker = require('../models/Speaker.js');

// Create a new speaker registration
exports.createSpeaker = async (req, res) => {
    try {
        const newSpeaker = new Speaker(req.body);
        await newSpeaker.save();
        res.status(201).json({ success: true, message: 'Speaker application submitted successfully.', data: newSpeaker });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to submit speaker application.', error: error.message });
    }
};

// Get all speakers
exports.getAllSpeakers = async (req, res) => {
    try {
        const speakers = await Speaker.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: speakers.length, data: speakers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch speakers.', error: error.message });
    }
};

// Get a single speaker by ID
exports.getSpeakerById = async (req, res) => {
    try {
        const speaker = await Speaker.findById(req.params.id);
        if (!speaker) {
            return res.status(404).json({ success: false, message: 'Speaker not found.' });
        }
        res.status(200).json({ success: true, data: speaker });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch speaker.', error: error.message });
    }
};

// Update speaker status
exports.updateSpeakerStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updatedSpeaker = await Speaker.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
        if (!updatedSpeaker) {
            return res.status(404).json({ success: false, message: 'Speaker not found.' });
        }
        res.status(200).json({ success: true, message: 'Speaker status updated.', data: updatedSpeaker });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to update status.', error: error.message });
    }
};

// Delete a speaker
exports.deleteSpeaker = async (req, res) => {
    try {
        const deletedSpeaker = await Speaker.findByIdAndDelete(req.params.id);
        if (!deletedSpeaker) {
            return res.status(404).json({ success: false, message: 'Speaker not found.' });
        }
        res.status(200).json({ success: true, message: 'Speaker deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete speaker.', error: error.message });
    }
};