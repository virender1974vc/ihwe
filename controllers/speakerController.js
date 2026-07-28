const Speaker = require('../models/Speaker.js');
const emailService = require('../utils/emailService');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeMobile = (value = '') => String(value).replace(/\D/g, '');

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

        const emailNormalized = String(speakerData.email || '').trim().toLowerCase();
        const mobileNormalized = normalizeMobile(speakerData.mobile);

        if (!emailNormalized || !mobileNormalized) {
            return res.status(400).json({
                success: false,
                message: 'Email and mobile number are required.'
            });
        }

        const existingSpeaker = await Speaker.findOne({
            $or: [
                { emailNormalized },
                { email: emailNormalized },
                { mobileNormalized },
                { mobile: String(speakerData.mobile || '').trim() },
                { mobile: { $regex: `^\\D*${escapeRegex(mobileNormalized).split('').join('\\D*')}\\D*$` } }
            ]
        }).select('_id email mobile');

        if (existingSpeaker) {
            return res.status(409).json({
                success: false,
                message: 'This email or mobile number is already registered as a speaker.'
            });
        }

        speakerData.emailNormalized = emailNormalized;
        speakerData.mobileNormalized = mobileNormalized;

        // Attach Cloudinary file URLs if uploaded
        if (req.files) {
            if (req.files.speakerPhoto?.[0]) speakerData.speakerPhotoUrl = req.files.speakerPhoto[0].path;
            if (req.files.companyLogo?.[0]) speakerData.companyLogoUrl = req.files.companyLogo[0].path;
            if (req.files.presentation?.[0]) speakerData.presentationUrl = req.files.presentation[0].path;
        }

        const newSpeaker = new Speaker(speakerData);
        await newSpeaker.save();

        emailService.sendSpeakerNominationEmails({
            fullName: newSpeaker.fullName,
            email: newSpeaker.email,
            phone: newSpeaker.mobile,
            topic: newSpeaker.preferredTopic,
            expertise: Array.isArray(newSpeaker.expertise) ? newSpeaker.expertise.join(', ') : newSpeaker.expertise,
            designation: newSpeaker.designation,
            organization: newSpeaker.organization,
            city: newSpeaker.city,
            linkedinUrl: newSpeaker.linkedin,
            biography: newSpeaker.briefProfile
        }).catch(err => {
            console.error('Speaker registration notification failed:', err.message);
        });

        res.status(201).json({ success: true, message: 'Speaker application submitted successfully.', data: newSpeaker });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This email or mobile number is already registered as a speaker.'
            });
        }
        if (error.name === 'ValidationError') {
            const validationMessage = Object.values(error.errors || {})
                .map(err => err.message)
                .filter(Boolean)
                .join(' ');

            return res.status(400).json({
                success: false,
                message: validationMessage || 'Please complete all required speaker registration fields.',
                error: error.message
            });
        }
        res.status(400).json({ success: false, message: error.message || 'Failed to submit speaker application.', error: error.message });
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
        const updatedSpeaker = await Speaker.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after', runValidators: true });
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
