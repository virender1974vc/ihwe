const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ArogyaCertificateConfig = require('./models/arogyaCertificateConfig');

dotenv.config();

const DB_URI = process.env.MONGO_URI_MAIN || process.env.MONGODB_URI || 'mongodb://localhost:27017/ihwe_db';

const juryText = {
  bodyTextPart1: 'We extend our gratitude to',
  bodyTextPart2: 'for serving as a Jury Member for the Paper Presentation at the 18th',
  highlightText1: 'Arogya Sangoshthi',
  bodyTextPart3: 'Seminar & 9th Edition of',
  highlightText2: 'International Health & Wellness',
  highlightText3: 'Expo 2026',
  bodyTextPart4: ', organised by Namo Gange Trust, held from 21st August to 23rd August 2026',
  bodyTextPart5: 'at Pragati Maidan, New Delhi, Bharat.',
  bodyTextPart6: 'Your expertise, fair evaluation, and insights contributed to the success',
  bodyTextPart7: 'of the sessions.',
  bodyTextPart8: 'We sincerely appreciate your dedication, professionalism, and commitment to promoting',
  bodyTextPart9: 'excellence in healthcare, research, and innovation.',
};

const seedJuryCertificateText = async () => {
  try {
    await mongoose.connect(DB_URI);

    const result = await ArogyaCertificateConfig.findOneAndUpdate(
      { certificateType: 'juryMember' },
      { $set: { certificateType: 'juryMember', ...juryText } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    console.log('Jury certificate text updated.');
    console.log(`Config ID: ${result._id}`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating jury certificate text:', error);
    process.exit(1);
  }
};

seedJuryCertificateText();
