const mongoose = require('mongoose');

const certificateRecipientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['exhibitor', 'speaker', 'delegate', 'knowledge_partner', 'supporting_association', 'healthcare_partner', 'special_guest', 'chief_guest', 'guest', 'juryMember', 'paperPresentation', 'posterPresentation'],
    required: true
  },
  company: { type: String, default: '' },
  isManual: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CertificateRecipient', certificateRecipientSchema);
