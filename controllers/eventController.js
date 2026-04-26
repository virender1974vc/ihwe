const eventService = require('../services/eventService');
const { logActivity } = require('../utils/logger');

class EventController {
    async getAllEvents(req, res) {
        try {
            const data = await eventService.getAllEvents();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getEventById(req, res) {
        try {
            const data = await eventService.getEventById(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: 'Event not found' });
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getEventById(req, res) {
        try {
            const data = await eventService.getEventById(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: 'Event not found' });
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
            await logActivity(req, 'Created', 'Event Schedule', `Added new event: ${req.body.title}`);
            res.status(201).json({ success: true, message: 'Event added successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateEvent(req, res) {
        try {
            const data = await eventService.updateEvent(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Event Schedule', `Updated event: ${req.body.title || 'ID: ' + req.params.id}`);
            res.json({ success: true, message: 'Event updated successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteEvent(req, res) {
        try {
            await eventService.deleteEvent(req.params.id);
            await logActivity(req, 'Deleted', 'Event Schedule', `Deleted event ID: ${req.params.id}`);
            res.json({ success: true, message: 'Event deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getCurrentEvent(req, res) {
        try {
            const data = await eventService.getCurrentEvent();
            if (!data) return res.status(404).json({ success: false, message: 'No current event found' });
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new EventController();
