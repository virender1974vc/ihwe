const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
  icon: { type: String, default: 'Users' },
  value: { type: String, default: '8,000+' },
  label: { type: String, default: 'Visitors / Delegates' },
  color: { type: String, default: '#004ac2ff' }
});

const bottomStatSchema = new mongoose.Schema({
  icon: { type: String, default: 'Users' },
  label: { type: String, default: 'B2B' },
  value: { type: String, default: 'B2B Meetings' }
});

const newTestimonialSchema = new mongoose.Schema({
  // Main Hero Section
  subtitle: { type: String, default: 'Voices That Inspire Change' },
  heading: { 
    type: String, 
    default: 'What Industry<br />Leaders Say<br />About IHWE' 
  },
  description: { 
    type: String, 
    default: 'Real experiences. Real partnerships. Real impact. Discover how IHWE is transforming the global health & wellness ecosystem.' 
  },
  heroBgImage: { type: String }, 
  heroBgAlt: { type: String, default: 'IHWE Expo Background' },
  
  // Section Divider
  dividerText: { type: String, default: 'WHAT OUR EXHIBITORS & PARTNERS SAY' },
  
  // Stats (Hero)
  heroStats: [statSchema], // Array of 4 stats
  
  // Video Section Settings
  videoMainHeading: { type: String, default: 'Our Exhibitors' },
  videoSubheading: { type: String, default: 'Hear Directly From' },
  videoDescription: { type: String, default: 'Real stories from real partners who experienced the IHWE impact.' },
  videoButtonText: { type: String, default: 'View More Videos' },
  videoButtonPath: { type: String, default: '#' },
  
  // Bottom Bar & CTA
  bottomBarStats: [bottomStatSchema],
  ctaMainText: { type: String, default: 'Be the Next' },
  ctaSubText: { type: String, default: 'Success Story' },
  ctaBottomText: { type: String, default: 'at IHWE 2026!' },
  ctaButton1Name: { type: String, default: 'Book Your Stall' },
  ctaButton1Path: { type: String, default: '/book-a-stand' },
  ctaButton2Name: { type: String, default: 'Apply Now' },
  ctaButton2Path: { type: String, default: '/registration' }

}, { timestamps: true });

module.exports = mongoose.model('NewTestimonial', newTestimonialSchema);
