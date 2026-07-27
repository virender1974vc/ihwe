const EventOverview = require('../models/EventOverview');

const defaultSectors = [
    { label: "Healthcare & Medical Industry", iconName: "HeartPulse", color: "#3b82f6" },
    { label: "AYUSH & Traditional Medicine", iconName: "Sprout", color: "#22c55e" },
    { label: "Wellness, Fitness & Lifestyle", iconName: "User", color: "#f59e0b" },
    { label: "Digital Health, AI & Medical Technology", iconName: "MonitorDot", color: "#8b5cf6" },
    { label: "Medical Tourism in India", iconName: "Plane", color: "#06b6d4" },
    { label: "Nutrition, Organic & Sustainable Living", iconName: "Leaf", color: "#10b981" }
];

exports.getEventOverview = async (req, res) => {
    try {
        let data = await EventOverview.findOne();
        if (!data) {
            data = new EventOverview({
                sectors: defaultSectors
            });
            await data.save();
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateEventOverview = async (req, res) => {
    try {
        const updateData = req.body;
        let data = await EventOverview.findOne();
        
        if (data) {
            // Update existing
            Object.assign(data, updateData);
            data.updatedAt = Date.now();
            await data.save();
        } else {
            // Create new
            data = new EventOverview(updateData);
            await data.save();
        }
        
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
