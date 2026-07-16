const mongoose = require('mongoose');

const certificateDataSchema = new mongoose.Schema({
  expo_logo: { type: String, default: '' },
  certi_name: { type: String, default: 'CERTIFICATE Of Participation & Appreciation' },
  certi_desc1: { type: String, default: 'We extend our heartfelt gratitude to ' },
  certi_desc1_part2: { type: String, default: 'for valuable participation in the 9th\nEdition of International Health & Wellness Expo, organized by Namo Gange Trust, held from 21st\nAugust to 23 August 2026 at Pragati Maidan, New Delhi, Bharat.' },
  certi_desc2: { type: String, default: '' },
  certi_desc3: { type: String, default: '' },
  certi_address: { type: String, default: '' },
  
  sign1_image: { type: String, default: '' },
  sign1_name: { type: String, default: 'H.H.Shri Acharya Jagdish ji' },
  sign1_designation: { type: String, default: 'Founder' },

  sign2_image: { type: String, default: '' },
  sign2_name: { type: String, default: '' },
  sign2_designation: { type: String, default: '' },
  namo_gange_trust_logos: { type: [String], default: [] },
  concurrent_events: { type: [String], default: [] },
  header_left_heading: { type: String, default: 'SUPPORTED BY:' },
  header_left_logo: { type: String, default: '' },
  header_left_enable: { type: Boolean, default: true },
  header_center_logo: { type: String, default: '' },
  header_center_text: { type: String, default: 'Presents' },
  header_center_enable: { type: Boolean, default: true },
  header_right_heading: { type: String, default: 'SUPPORTED BY:' },
  header_right_logo: { type: String, default: '' },
  header_right_enable: { type: Boolean, default: false },
  certificate_title_image: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CertificateData', certificateDataSchema);
