const mongoose = require('mongoose');

const awardCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  order: {
    type: Number,
    default: 0,
  },
  added_by: {
    type: String,
    default: 'Admin',
  },
  updated_by: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('AwardCategory', awardCategorySchema);
