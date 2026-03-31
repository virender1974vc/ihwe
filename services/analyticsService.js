const Analytics = require('../models/Analytics');

/**
 * Service to handle Analytics operations.
 */
class AnalyticsService {
    /**
     * Log a click.
     */
    async logClick(iconName, ipAddress) {
        const newLog = new Analytics({
            iconName,
            ipAddress
        });
        return await newLog.save();
    }

    /**
     * Get stats and logs.
     */
    async getStats(options) {
        const { page = 1, limit = 25, date, startDate, endDate } = options;
        
        let query = {};
        
        // Date Filtering
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.timestamp = { $gte: startOfDay, $lte: endOfDay };
        } else if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.timestamp = { $gte: start, $lte: end };
        }

        // Fetch Logs (Paginated)
        const totalLogs = await Analytics.countDocuments(query);
        const logs = await Analytics.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Fetch Stats for the specific period
        const allLogsInPeriod = await Analytics.find(query);
        
        const stats = {
            total: allLogsInPeriod.length,
            whatsapp: allLogsInPeriod.filter(l => l.iconName.toLowerCase().includes('whatsapp')).length,
            call: allLogsInPeriod.filter(l => l.iconName.toLowerCase().includes('call')).length,
            social: allLogsInPeriod.filter(l => 
                ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'social'].some(s => l.iconName.toLowerCase().includes(s))
            ).length,
            bookMeeting: allLogsInPeriod.filter(l => 
                ['register', 'book', 'meeting'].some(s => l.iconName.toLowerCase().includes(s))
            ).length
        };

        return {
            stats,
            logs,
            pagination: {
                total: totalLogs,
                page: parseInt(page),
                pages: Math.ceil(totalLogs / limit)
            }
        };
    }
}

module.exports = new AnalyticsService();
