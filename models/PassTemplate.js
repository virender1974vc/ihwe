const mongoose = require('mongoose');

const PassTemplateSchema = new mongoose.Schema({
    // Multi-event support: a template can stay global/reusable (null — the default,
    // seeded reference template) OR be scoped to one event's specific badge design.
    eventId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    templateVersion: { type: Number, default: 1 },
    description: { type: String, default: '' },
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    canvas: {
        width: { type: Number, default: 640 },
        height: { type: Number, default: 900 },
        unit: { type: String, default: 'px' },
        dpi: { type: Number, default: 300 },
        backgroundColor: { type: String, default: '#ffffff' },
        safeArea: {
            top: { type: Number, default: 24 },
            right: { type: Number, default: 24 },
            bottom: { type: Number, default: 24 },
            left: { type: Number, default: 24 },
        },
    },
    passTypes: [{ type: String }],
    categories: [{ type: String }],
    logoPriority: {
        type: [String],
        default: ['individualPassOverride', 'passTypeLogo', 'eventLogo', 'templateDefaultLogo'],
    },
    layers: { type: [mongoose.Schema.Types.Mixed], default: [] },
    logoGroups: { type: [mongoose.Schema.Types.Mixed], default: [] },
    overrides: { type: mongoose.Schema.Types.Mixed, default: {} },
    qualityRules: {
        minDpi: { type: Number, default: 300 },
        allowedTypes: { type: [String], default: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'] },
        maxFileSizeMb: { type: Number, default: 10 },
        warnOnUpscalePercent: { type: Number, default: 125 },
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, minimize: false });

module.exports = mongoose.model('PassTemplate', PassTemplateSchema);
