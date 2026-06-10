const mongoose = require('mongoose');

const whyParticipateSchema = new mongoose.Schema({
  subtitle: { 
    type: String, 
    default: 'WHY PARTICIPATE' 
  },
  heading: { 
    type: String, 
    default: 'Your Gateway to Growth' 
  },
  description: { 
    type: String, 
    default: 'The International Health & Wellness Expo 2026 is a leading platform for health, wellness, fitness, beauty, Ayurveda, organic products, and medical innovation—bringing together top brands, buyers, investors, and industry leaders from India and worldwide.' 
  },
  keyPoints: {
    type: [String],
    default: [
      'Meet genuine buyers, distributors, retailers, and healthcare professionals',
      'Generate high-quality B2B & B2C leads with faster business conversions',
      'Launch new products with maximum visibility and market impact',
      'Expand your dealer, distributor, franchise, and export network',
      'Strengthen brand presence through live demos and media exposure',
      'Connect with investors, CEOs, doctors, and key decision-makers',
      'Achieve higher ROI with direct customer engagement and trust building'
    ]
  },
  button1Text: { 
    type: String, 
    default: 'Exhibit With Us' 
  },
  button1Path: { 
    type: String, 
    default: '/exhibit' 
  },
  button2Text: { 
    type: String, 
    default: 'Download Brochure' 
  },
  button2File: { 
    type: String 
  },
  image: { 
    type: String 
  },
  imageAltText: { 
    type: String, 
    default: 'Why Participate' 
  },
  imageOverlayText: { 
    type: String, 
    default: 'Build Relationships. Generate Leads. Grow Your Business.' 
  },
  mainPoints: {
    type: [String],
    default: ['Exhibit', 'Connect', 'Grow']
  }
}, { timestamps: true });

module.exports = mongoose.model('WhyParticipate', whyParticipateSchema);
