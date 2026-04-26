const Event = require('../models/Event');

class EventService {
    async getAllEvents() {
        return await Event.find().sort({ order: 1, startDate: -1 });
    }
    async getActiveEvents() {
        return await Event.find({ status: 'active' }).sort({ order: 1, startDate: -1 });
    }
    async addEvent(data) {
        const event = new Event(data);
        return await event.save();
    }
    async getEventById(id) {
        return await Event.findById(id);
    }
    async updateEvent(id, data) {
        const { _id, __v, createdAt, updatedAt, ...updateData } = data;
        return await Event.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
    }
    async deleteEvent(id) {
        return await Event.findByIdAndDelete(id);
    }
}

module.exports = new EventService();
