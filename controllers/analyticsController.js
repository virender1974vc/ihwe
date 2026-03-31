const analyticsService = require('../services/analyticsService');

/**
 * Controller to handle Analytics requests.
 */
class AnalyticsController {
    /**
     * Log a click.
     */
    async logClick(req, res) {
        try {
            const { iconName } = req.body;
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

            if (!iconName) {
                return res.status(400).json({ success: false, message: "Icon name is required" });
            }

            await analyticsService.logClick(iconName, ipAddress);
            res.status(201).json({ success: true, message: "Click logged successfully" });
        } catch (error) {
            console.error("Error logging click:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    /**
     * Get stats and logs.
     */
    async getStats(req, res) {
        try {
            const { page, limit, date, startDate, endDate } = req.query;
            const data = await analyticsService.getStats({ page, limit, date, startDate, endDate });
            
            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error("Error fetching analytics stats:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}

module.exports = new AnalyticsController();
