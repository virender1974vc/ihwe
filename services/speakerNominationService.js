const SpeakerNomination = require('../models/SpeakerNomination');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');

/**
 * Service to handle Speaker Nomination operations.
 */
class SpeakerNominationService {
    /**
     * Submit a speaker nomination.
     */
    async submitNomination(data) {
        const { 
            title, firstName, lastName, officialEmail, mobileNo, 
            linkedinUrl, organizationName, designation, areaOfExpertise, 
            country, state, city, proposedTopic, shortBiography 
        } = data;

        // Basic Validation
        if (!firstName || !lastName || !officialEmail || !mobileNo || !organizationName || !designation || !proposedTopic) {
            throw { status: 400, message: 'Required fields are missing' };
        }

        const newNomination = new SpeakerNomination(data);
        const savedNomination = await newNomination.save();

        const fullName = `${title.toUpperCase()} ${firstName} ${lastName}`;

        // 1. Send Professional Dynamic Response (Email + WhatsApp) to User & Admin Alert
        emailService.sendSpeakerNominationEmails({
            fullName,
            email: officialEmail,
            phone: mobileNo,
            topic: proposedTopic,
            expertise: areaOfExpertise,
            designation,
            organization: organizationName,
            city
        }).catch(err => {
            console.error('Speaker Messaging Error:', err);
        });

        return savedNomination;

        return savedNomination;
    }

    /**
     * Get all speaker nominations.
     */
    async getAllNominations() {
        return await SpeakerNomination.find().sort({ createdAt: -1 });
    }

    /**
     * Delete a speaker nomination.
     */
    async deleteNomination(id) {
        const nomination = await SpeakerNomination.findById(id);
        if (!nomination) {
            throw { status: 404, message: 'Nomination not found' };
        }
        return await nomination.deleteOne();
    }
}

module.exports = new SpeakerNominationService();
