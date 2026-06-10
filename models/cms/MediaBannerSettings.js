const mongoose = require('mongoose');

const mediaBannerSettingsSchema = new mongoose.Schema({
    heroTitle: {
        type: String,
        default: '9th INTERNATIONAL HEALTH & WELLNESS EXPO 2026'
    },
    heroSubtitle: {
        type: String,
        default: 'Showcasing the global recognition and media visibility of IHWE 2026'
    },
    stats: [
        {
            number: { type: String, default: '100+' },
            label: { type: String, default: 'Media Mentions' }
        },
        {
            number: { type: String, default: '1M+' },
            label: { type: String, default: 'Audience Reach' }
        },
        {
            number: { type: String, default: '20+' },
            label: { type: String, default: 'Media Partners' }
        },
        {
            number: { type: String, default: '12+' },
            label: { type: String, default: 'Countries Coverage' }
        }
    ],
    updatedBy: String
}, { timestamps: true });

module.exports = mongoose.model('MediaBannerSettings', mediaBannerSettingsSchema);
