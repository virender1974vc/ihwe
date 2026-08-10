const eventService = require('../services/eventService');
const { logActivity } = require('../utils/logger');

const formatEventDate = (value) => {
    if (!value) return 'blank';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normalizeComparable = (value) => {
    if (value === undefined || value === null || value === '') return '';
    if (value instanceof Date) return formatEventDate(value);
    if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
    return String(value).trim();
};

const summarizeEventChanges = (beforeDoc, afterDoc) => {
    const before = beforeDoc?.toObject ? beforeDoc.toObject() : (beforeDoc || {});
    const after = afterDoc?.toObject ? afterDoc.toObject() : (afterDoc || {});
    const fields = [
        ['name', 'Event Name'],
        ['paymentFilterName', 'Short Name'],
        ['startDate', 'Start Date', formatEventDate],
        ['endDate', 'End Date', formatEventDate],
        ['location', 'Venue'],
        ['status', 'Status'],
        ['description', 'Description'],
        ['earlyBirdDiscountActive', 'Early Bird Discount Status'],
        ['earlyBirdDiscountPercent', 'Early Bird Discount'],
        ['earlyBirdValidityDays', 'Early Bird Validity Days'],
        ['paymentRemindersActive', 'Payment Reminder Status'],
        ['paymentReminderDays', 'Reminder Days'],
        ['paymentPlans', 'Payment Plan']
    ];

    return fields.reduce((changes, [key, label, formatter]) => {
        const oldValue = before[key];
        const newValue = after[key];
        if (normalizeComparable(oldValue) === normalizeComparable(newValue)) return changes;

        if (key === 'description') {
            changes.push(`${label} updated`);
        } else if (key === 'paymentPlans') {
            changes.push(`${label} updated`);
        } else if (key === 'paymentReminderDays') {
            changes.push(`${label}: ${(newValue || []).join(', ')} days`);
        } else {
            const format = formatter || ((value) => value || 'blank');
            changes.push(`${label}: ${format(oldValue)} -> ${format(newValue)}`);
        }
        return changes;
    }, []);
};

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
            await logActivity(req, 'Created', 'Event Schedule', `Created event: ${data.name || req.body.name || 'Untitled Event'} | Date: ${formatEventDate(data.startDate)} to ${formatEventDate(data.endDate)} | Venue: ${data.location || 'blank'}`);
            res.status(201).json({ success: true, message: 'Event added successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateEvent(req, res) {
        try {
            const before = await eventService.getEventById(req.params.id);
            const data = await eventService.updateEvent(req.params.id, req.body);
            const changes = summarizeEventChanges(before, data);
            await logActivity(req, 'Updated', 'Event Schedule', `Updated event: ${data?.name || req.body.name || 'Untitled Event'} | Changed: ${changes.length ? changes.join('; ') : 'No visible field changes'}`);
            res.json({ success: true, message: 'Event updated successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteEvent(req, res) {
        try {
            const deletedEvent = await eventService.deleteEvent(req.params.id);
            await logActivity(req, 'Deleted', 'Event Schedule', `Deleted event: ${deletedEvent?.name || 'Untitled Event'}`);
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
