const mongoose = require('mongoose');

const ePromotionReachSchema = new mongoose.Schema({
    tradeVisitors: { type: String, default: '20,000+' },
    exhibitors: { type: String, default: '500+' },
    countries: { type: String, default: '25+' },
    socialMediaReach: { type: String, default: '500,000+' },
    emailReach: { type: String, default: '100,000+' }
}, { timestamps: true });

module.exports = mongoose.model('EPromotionReach', ePromotionReachSchema);
