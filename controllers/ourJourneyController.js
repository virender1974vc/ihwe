const OurJourney = require('../models/OurJourney');

const defaultJourneyItems = [
    { year: "2016", text: "Company Founded — commitment to exceptional exhibition management." },
    { year: "2016–25", text: "Successfully organized International Health & Wellness Expos, establishing a credible global platform for integrated healthcare, preventive wellness and medical innovation." },
    { year: "2026", text: "IHWE 9th Edition — nine successful editions, sustained growth, expanding global participation and established leadership in the integrated healthcare and wellness industry." }
];

const defaultSectorsItems = [
    { label: "Health & Wellness", text: "Shaping the future of integrated personal & public healthcare through innovation, prevention, and global collaboration." },
    { label: "Medical Sustainability", text: "Promoting eco-friendly medical practices, sustainable hospital infrastructure and green healthcare technologies." },
    { label: "Digital Health", text: "Bridging technology and healthcare for smarter solutions." },
    { label: "Health Tourism", text: "Positioning India as a global leader in health travel." }
];

const defaultEventsList = [
    "International Health & Wellness Expo",
    "Indo Himalayan Expo",
    "Punjab Health & Wellness Expo",
    "The Yogshala Expo",
    "Arogya Sangoshthi",
    "Agritech Innovate India",
    "Bharat Development & Schemes Expo",
    "Organic Expo"
];

exports.getOurJourney = async (req, res) => {
    try {
        let data = await OurJourney.findOne();
        if (!data) {
            data = new OurJourney({
                journeyItems: defaultJourneyItems,
                sectorsItems: defaultSectorsItems,
                eventsList: defaultEventsList
            });
            await data.save();
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateOurJourney = async (req, res) => {
    try {
        const { _id, __v, createdAt, ...updateData } = req.body;
        let data = await OurJourney.findOne();
        
        if (data) {
            Object.assign(data, updateData);
            data.updatedAt = Date.now();
            await data.save();
        } else {
            data = new OurJourney(updateData);
            await data.save();
        }
        
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
