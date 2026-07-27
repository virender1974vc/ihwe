const PaperPresentation = require('../models/PaperPresentation');

exports.getPaperPresentationData = async (req, res) => {
    try {
        let data = await PaperPresentation.findOne();
        if (!data) {
            data = await PaperPresentation.create({
                guidelines: [],
                topics: [],
                importantNotes: [],
                timeline: []
            });
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching paper presentation data:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updatePaperPresentationData = async (req, res) => {
    try {
        const { guidelines, topics, importantNotes, timeline } = req.body;
        
        let data = await PaperPresentation.findOne();
        if (data) {
            data.guidelines = guidelines || data.guidelines;
            data.topics = topics || data.topics;
            data.importantNotes = importantNotes || data.importantNotes;
            data.timeline = timeline || data.timeline;
            await data.save();
        } else {
            data = await PaperPresentation.create({ guidelines, topics, importantNotes, timeline });
        }
        
        res.status(200).json({ success: true, message: 'Data updated successfully', data });
    } catch (error) {
        console.error('Error updating paper presentation data:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
