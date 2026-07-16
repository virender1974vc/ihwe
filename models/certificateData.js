const mongoose = require('mongoose');

const certificateDataSchema = new mongoose.Schema({
  expo_logo: { type: String, default: '' },
  certi_name: { type: String, default: 'CERTIFICATE Of Participation & Appreciation' },
  certi_description: { type: String, default: '' },
  
  sign1_image: { type: String, default: '' },
  sign1_name: { type: String, default: 'H.H.Shri Acharya Jagdish ji' },
  sign1_designation: { type: String, default: 'Founder' },

  sign2_image: { type: String, default: '' },
  sign2_name: { type: String, default: 'Shri Vijay Sharma' },
  sign2_designation: { type: String, default: 'Chairman' },

  namo_gange_trust_logos: { type: [String], default: [] },
  concurrent_events: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('CertificateData', certificateDataSchema);
