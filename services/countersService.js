const Counter = require('../models/Counter');

/**
 * Service to handle Counter operations.
 */
class CountersService {
    /**
     * Get all counters.
     */
    async getAllCounters() {
        return await Counter.find().sort({ order: 1 });
    }

    /**
     * Create a new counter.
     */
    async createCounter(data) {
        const { icon, end, suffix, label, bg, altText, overlay } = data;
        const newCounter = new Counter({
            icon,
            end: Number(end),
            suffix,
            label,
            bg,
            altText,
            overlay: Number(overlay) || 0.4
        });
        return await newCounter.save();
    }

    /**
     * Update a counter.
     */
    async updateCounter(id, data) {
        const { icon, end, suffix, label, bg, altText, overlay } = data;
        const updateData = {
            icon,
            end: Number(end),
            suffix,
            label,
            altText,
            overlay: Number(overlay)
        };
        if (bg) updateData.bg = bg;

        const updated = await Counter.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) throw { status: 404, message: 'Counter not found' };
        return updated;
    }

    /**
     * Delete a counter.
     */
    async deleteCounter(id) {
        const counter = await Counter.findByIdAndDelete(id);
        if (!counter) throw { status: 404, message: 'Counter not found' };
        return counter;
    }
}

module.exports = new CountersService();
