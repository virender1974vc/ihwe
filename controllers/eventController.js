const eventService = require('../services/eventService');

class EventController {
    async getAllEvents(req, res) {
        try {
            const data = await eventService.getAllEvents();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getActiveEvents(req, res) {
        try {
            const data = await eventService.getActiveEvents();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async addEvent(req, res) {
        try {
            const data = await eventService.addEvent(req.body);
            res.status(201).json({ success: true, message: 'Event added successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateEvent(req, res) {
        try {
            const data = await eventService.updateEvent(req.params.id, req.body);
            res.json({ success: true, message: 'Event updated successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteEvent(req, res) {
        try {
            await eventService.deleteEvent(req.params.id);
            res.json({ success: true, message: 'Event deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new EventController();
