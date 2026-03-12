const mongoose = require('mongoose');

const pdfCardSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    meta: { type: String, required: true },
    badge: { type: String, required: true },
    badgeColor: { type: String, default: 'bg-[#d26019]' },
    image: { type: String, required: true },
    imageAlt: { type: String, default: '' },
    pdf: { type: String, required: true },
    tag: { type: String, required: true },
    order: { type: Number, default: 0 }
});

const downloadPdfSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Resources' },
    heading: { type: String, default: 'Expand Your Business with Health & Wellness' },
    highlightTitle: { type: String, default: 'Health & Wellness' },
    description: { type: String, default: 'Download our official reports, brochures, and floor plans to stay informed and plan your participation.' },
    cards: [pdfCardSchema]
}, { timestamps: true });

module.exports = mongoose.model('DownloadPdf', downloadPdfSchema);
