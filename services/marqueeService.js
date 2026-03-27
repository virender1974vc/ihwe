const Marquee = require('../models/Marquee');

/**
 * Service to handle Marquee settings operations.
 */
class MarqueeService {
    /**
     * Get marquee settings, creates default if none exists.
     */
    async getMarquee() {
        let marquee = await Marquee.findOne();
        if (!marquee) {
            marquee = await new Marquee({}).save();
        }
        return marquee;
    }

    /**
     * Update marquee settings.
     */
    async updateMarquee(data) {
        const { text, bgColor } = data;
        let marquee = await Marquee.findOne();
        if (!marquee) {
            marquee = new Marquee({});
        }

        if (text !== undefined) marquee.text = text;
        if (bgColor !== undefined) marquee.bgColor = bgColor;

        return await marquee.save();
    }
}

module.exports = new MarqueeService();
