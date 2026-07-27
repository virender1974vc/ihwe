const mongoose = require('mongoose');

const supportedByItemSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  label2: { type: String, required: true },
  order: { type: Number, default: 0 },
  updatedBy: { type: String, default: 'System' },
  updatedAt: { type: Date, default: Date.now }
});

const supportedBySchema = new mongoose.Schema({
  title: { type: String, default: 'Supported By' },
  bgColor: { type: String, default: '#23471d' },
  items: [supportedByItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('SupportedBy', supportedBySchema);
