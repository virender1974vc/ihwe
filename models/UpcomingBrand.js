const mongoose = require('mongoose');

const upcomingBrandItemSchema = new mongoose.Schema({
  logo: { type: String, required: true },
  altText: { type: String, default: '' },
  order: { type: Number, default: 0 },
  updatedBy: { type: String, default: 'System' },
  updatedAt: { type: Date, default: Date.now }
});

const upcomingBrandSchema = new mongoose.Schema({
  title: { type: String, default: 'UPCOMING LEADING BRANDS' },
  items: [upcomingBrandItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('UpcomingBrand', upcomingBrandSchema);
