const Speaker = require('../models/Speaker.js');

// Create a new speaker registration
exports.createSpeaker = async (req, res) => {
    try {
        const speakerData = { ...req.body };

        // Parse JSON arrays sent as strings in multipart form
        if (typeof speakerData.expertise === 'string') {
            try { speakerData.expertise = JSON.parse(speakerData.expertise); } catch { speakerData.expertise = [speakerData.expertise]; }
        }
        if (typeof speakerData.expectations === 'string') {
            try { speakerData.expectations = JSON.parse(speakerData.expectations); } catch { speakerData.expectations = [speakerData.expectations]; }
        }
        // Booleans come as strings in multipart
        if (typeof speakerData.consent1 === 'string') speakerData.consent1 = speakerData.consent1 === 'true';
        if (typeof speakerData.consent2 === 'string') speakerData.consent2 = speakerData.consent2 === 'true';

        // Attach Cloudinary file URLs if uploaded
        if (req.files) {
            if (req.files.speakerPhoto?.[0]) speakerData.speakerPhotoUrl = req.files.speakerPhoto[0].path;
            if (req.files.companyLogo?.[0]) speakerData.companyLogoUrl = req.files.companyLogo[0].path;
            if (req.files.presentation?.[0]) speakerData.presentationUrl = req.files.presentation[0].path;
        }

        const newSpeaker = new Speaker(speakerData);
        await newSpeaker.save();
        res.status(201).json({ success: true, message: 'Speaker application submitted successfully.', data: newSpeaker });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to submit speaker application.', error: error.message });
    }
};
exports.getAllSpeakers = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const speakers = await Speaker.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: speakers.length, data: speakers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch speakers.', error: error.message });
    }
};
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