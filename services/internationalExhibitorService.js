const InternationalExhibitor = require('../models/InternationalExhibitor');

class InternationalExhibitorService {
    async getAllRegistrations() {
        return await InternationalExhibitor.find().sort({ createdAt: -1 });
    }

    async getRegistrationById(id) {
        return await InternationalExhibitor.findById(id);
    }

    async addRegistration(data) {
        // Generate a unique registration ID
        const count = await InternationalExhibitor.countDocuments();
        const registrationId = `INTL-${2026}-${(count + 1).toString().padStart(4, '0')}`;
        
        const registration = new InternationalExhibitor({
            ...data,
            registrationId
        });
        return await registration.save();
    }

    async updateRegistration(id, data) {
        return await InternationalExhibitor.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true }
        );
    }

    async deleteRegistration(id) {
        return await InternationalExhibitor.findByIdAndDelete(id);
    }
}

module.exports = new InternationalExhibitorService();
