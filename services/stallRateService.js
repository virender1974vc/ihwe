const StallRate = require('../models/StallRate');

class StallRateService {
    async getAllRates() {
        return await StallRate.find().populate('eventId').sort({ createdAt: -1 });
    }
    async getRatesByEvent(eventId) {
        return await StallRate.find({ eventId }).sort({ stallType: 1 });
    }
    async addRate(data) {
        // Handle upsert to avoid duplicates
        return await StallRate.findOneAndUpdate(
            { eventId: data.eventId, currency: data.currency, stallType: data.stallType },
            data,
            { upsert: true, new: true }
        );
    }
    async getRateById(id) {
        return await StallRate.findById(id).populate('eventId');
    }
    async updateRate(id, data) {
        return await StallRate.findByIdAndUpdate(id, data, { new: true });
    }
    async deleteRate(id) {
        return await StallRate.findByIdAndDelete(id);
    }
    async findRate(eventId, currency, stallType) {
        return await StallRate.findOne({ eventId, currency, stallType });
    }
}

module.exports = new StallRateService();
