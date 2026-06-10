const UpcomingEvent = require('../../models/event_conference/UpcomingEvent');

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await UpcomingEvent.find().sort({ order: 1, createdAt: -1 });
        res.status(200).json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add a new event
exports.addEvent = async (req, res) => {
    try {
        const { dateString, fullDate, time, title, location, colorClass, order } = req.body;
        
        const newEvent = new UpcomingEvent({
            dateString,
            fullDate,
            time,
            title,
            location,
            colorClass,
            order,
            updatedBy: req.user ? req.user.username : 'Admin'
        });

        await newEvent.save();
        res.status(201).json({ success: true, data: newEvent, message: 'Event added successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update an event
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body, updatedBy: req.user ? req.user.username : 'Admin' };
        
        const updatedEvent = await UpcomingEvent.findByIdAndUpdate(
            id,
            updateData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json({ success: true, data: updatedEvent, message: 'Event updated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEvent = await UpcomingEvent.findByIdAndDelete(id);

        if (!deletedEvent) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
