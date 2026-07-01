const mongoose = require('mongoose');

const exhibitorActivityLogSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  exhibitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExhibitorRegistration',
    required: false
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  module: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Success', 'Pending', 'Failed', 'Info'],
    default: 'Info'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExhibitorActivityLog', exhibitorActivityLogSchema);
