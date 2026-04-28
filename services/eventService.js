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
        return await Event.findByIdAndUpdate(id, data, { new: true });
    }
    async deleteEvent(id) {
        return await Event.findByIdAndDelete(id);
    }
    async getCurrentEvent() {
        return await Event.findOne({ status: 'active' }).sort({ startDate: -1 });
    }
}

module.exports = new EventService();
