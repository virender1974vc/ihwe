const mongoose = require('mongoose');

const SectorCardSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'Leaf' },
    image: { type: String, default: '' },
    imageAlt: { type: String, default: '' },
    order: { type: Number, default: 0 },
    updatedBy: { type: String, default: 'System' },
    updatedAt: { type: Date, default: Date.now }
});

const HealthcareSectorsSchema = new mongoose.Schema({
    heading: { type: String, default: 'EXPLORE DIVERSE HEALTHCARE SECTORs' },
    subtitle: { type: String, default: 'One Platform. Every Healthcare Solution.' },
    cards: [SectorCardSchema],
    updatedBy: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('HealthcareSectors', HealthcareSectorsSchema);
