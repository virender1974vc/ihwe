const ConferenceTrack = require('../models/ConferenceTrack');

class ConferenceTrackService {
    async getAll() {
        return await ConferenceTrack.find({ isActive: true }).sort({ order: 1 });
    }

    async getById(id) {
        return await ConferenceTrack.findById(id);
    }

    async create(data) {
        return await ConferenceTrack.create(data);
    }

    async update(id, data) {
        return await ConferenceTrack.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return await ConferenceTrack.findByIdAndDelete(id);
    }

    async updateOrder(orders) {
        const promises = orders.map(item => 
            ConferenceTrack.findByIdAndUpdate(item.id, { order: item.order })
        );
        return await Promise.all(promises);
    }
}

module.exports = new ConferenceTrackService();
