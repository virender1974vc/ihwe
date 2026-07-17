const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ArogyaCertificateConfig = require('./models/arogyaCertificateConfig');

dotenv.config();

const DB_URI = process.env.MONGO_URI_MAIN || process.env.MONGODB_URI || 'mongodb://localhost:27017/ihwe_db';

const speakerText = {
  bodyTextPart1: 'We extend our heartfelt gratitude to',
  bodyTextPart2: 'for being a Valuable Speaker at the 18th',
  highlightText1: 'Arogya Sangoshthi',
  bodyTextPart3: 'Seminar & 9th Edition of',
  highlightText2: 'International Health & Wellness',
  highlightText3: 'Expo 2026',
  bodyTextPart4: ', organised by Namo Gange Trust, held from 21st August to 23rd August 2026',
  bodyTextPart5: 'at Pragati Maidan, New Delhi, Bharat.',
  bodyTextPart6: 'Your insightful session, valuable expertise, and inspiring contribution greatly enriched',
  bodyTextPart7: 'the conference and benefited all participants.',
  bodyTextPart8: 'We sincerely appreciate your time, dedication, and commitment to advancing health and wellness,',
  bodyTextPart9: 'and look forward to your continued support in future initiatives.',
};

const seedSpeakerCertificateText = async () => {
  try {
    await mongoose.connect(DB_URI);

    const result = await ArogyaCertificateConfig.findOneAndUpdate(
      { certificateType: 'speaker' },
      { $set: { certificateType: 'speaker', ...speakerText } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    console.log('Speaker certificate text updated.');
    console.log(`Config ID: ${result._id}`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating speaker certificate text:', error);
    process.exit(1);
  }
};

seedSpeakerCertificateText();
