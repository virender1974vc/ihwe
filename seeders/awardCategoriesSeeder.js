require('dotenv').config();
const mongoose = require('mongoose');
const AwardCategory = require('../models/AwardCategory');

const defaultCategories = [
  {
    name: 'Best Hospital / Healthcare Institution',
    description: 'Recognizing hospitals and healthcare institutions that demonstrate exceptional standards of patient care, infrastructure, medical excellence, and community health impact.',
    order: 1,
  },
  {
    name: 'Excellence in Medical Practice',
    description: 'Honouring doctors, surgeons, and medical professionals who have shown outstanding dedication, innovation, and impact in their field of medical practice.',
    order: 2,
  },
  {
    name: 'Ayurveda & Natural Healing Leader',
    description: 'Celebrating practitioners, brands, and institutions that are advancing the ancient science of Ayurveda and natural healing through modern research and authentic practice.',
    order: 3,
  },
  {
    name: 'Wellness & Spa Brand of the Year',
    description: 'Recognizing wellness centres, spas, and holistic health brands that have set benchmarks in delivering transformative wellness experiences and promoting preventive health.',
    order: 4,
  },
  {
    name: 'Fitness Innovation Award',
    description: 'Honouring fitness brands, gyms, trainers, and technology platforms that are redefining fitness culture through innovation, accessibility, and measurable health outcomes.',
    order: 5,
  },
  {
    name: 'Nutrition & Organic Excellence',
    description: 'Recognizing individuals, brands, and organizations that are championing nutrition science, organic food, and healthy eating habits to improve public health.',
    order: 6,
  },
  {
    name: 'Medical Tourism Excellence',
    description: 'Celebrating hospitals, facilitators, and destinations that have made India a global hub for medical tourism by offering world-class treatment at affordable costs.',
    order: 7,
  },
  {
    name: 'Healthcare Startup of the Year',
    description: 'Honouring innovative startups that are disrupting the healthcare ecosystem with technology-driven solutions, digital health platforms, and scalable healthcare models.',
    order: 8,
  },
  {
    name: 'Women Leadership in Healthcare',
    description: 'Recognizing women leaders, doctors, entrepreneurs, and changemakers who are breaking barriers and driving transformation in the healthcare and wellness industry.',
    order: 9,
  },
  {
    name: 'Lifetime Achievement Award',
    description: 'The most prestigious recognition, honouring individuals who have dedicated their life to advancing healthcare, wellness, and the well-being of society over decades of service.',
    order: 10,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI_MAIN);
  console.log('✅ Connected to DB');

  for (const cat of defaultCategories) {
    const exists = await AwardCategory.findOne({ name: cat.name });
    if (!exists) {
      await AwardCategory.create({ ...cat, status: 'Active', added_by: 'System' });
      console.log(`✅ Created: ${cat.name}`);
    } else {
      await AwardCategory.findOneAndUpdate({ name: cat.name }, { description: cat.description, order: cat.order });
      console.log(`🔄 Updated: ${cat.name}`);
    }
  }

  console.log('\n✅ Seeding complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
