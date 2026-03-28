const Event = require('../models/Event');

class EventService {
    async getAllEvents() {
        return await Event.find().sort({ startDate: -1 });
    }
    async getActiveEvents() {
        return await Event.find({ status: 'active' }).sort({ startDate: -1 });
    }
    async addEvent(data) {
        const event = new Event(data);
        return await event.save();
    }
    async getEventById(id) {
        return await Event.findById(id);
    }
    async updateEvent(id, data) {
        return await Event.findByIdAndUpdate(id, data, { new: true });
    }
    async deleteEvent(id) {
        return await Event.findByIdAndDelete(id);
    }
}

module.exports = new EventService();
