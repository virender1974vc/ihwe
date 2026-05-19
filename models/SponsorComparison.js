const mongoose = require('mongoose');

const SponsorCardSchema = new mongoose.Schema({
    title: { type: String, required: true },
    desc: { type: String, required: true },
    image: { type: String, required: true },
    color: { type: String, default: 'blue' }
});

const ComparisonRowSchema = new mongoose.Schema({
    benefit: { type: String, required: true },
    values: [{ type: String }] // Array of checkmarks or strings corresponding to each card
});

const SponsorComparisonSchema = new mongoose.Schema({
    cards: [SponsorCardSchema],
    comparisonData: [ComparisonRowSchema],
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SponsorComparison', SponsorComparisonSchema);
