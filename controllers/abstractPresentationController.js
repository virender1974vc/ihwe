const AbstractPresentation = require('../models/AbstractPresentation');

// @desc    Get Poster Presentation Data
// @route   GET /api/poster-presentation
// @access  Public
exports.getAbstractPresentationData = async (req, res) => {
    try {
        let data = await AbstractPresentation.findOne();
        if (!data) {
            data = await AbstractPresentation.create({
                guidelines: [],
                topics: [],
                importantNotes: [],
                timeline: []
            });
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update Poster Presentation Data
// @route   PUT /api/poster-presentation
// @access  Private (Admin)
exports.updateAbstractPresentationData = async (req, res) => {
    try {
        const { guidelines, topics, importantNotes, timeline } = req.body;

        let data = await AbstractPresentation.findOne();

        if (data) {
            data.guidelines = guidelines;
            data.topics = topics;
            data.importantNotes = importantNotes;
            data.timeline = timeline;
            await data.save();
        } else {
            data = await AbstractPresentation.create({
                guidelines,
                topics,
                importantNotes,
                timeline
            });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
