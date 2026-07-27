const mongoose = require('mongoose');

const blogSettingSchema = new mongoose.Schema({
    articlesCount: { type: String, default: '250+' },
    expertsCount: { type: String, default: '50+' },
    countriesCount: { type: String, default: '12+' },
    updateFrequency: { type: String, default: 'Daily' },
    heroTitle: { type: String, default: 'BLOG & NEWS' },
    heroSubtitle: { type: String, default: 'Your go-to source for the latest updates, expert insights, industry trends and stories from the world of healthcare, wellness & innovation.' }
}, { timestamps: true });

module.exports = mongoose.model('BlogSetting', blogSettingSchema);
