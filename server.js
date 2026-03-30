const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Models
const User = require('./models/User');

// Routes
const sidebarRoutes = require('./routes/sidebar');
const rolesRoutes = require('./routes/roles');
const heroRoutes = require('./routes/hero');
const adminUsersRoutes = require('./routes/adminUsers');
const eventHighlightsRoutes = require('./routes/eventHighlights');
const aboutRoutes = require('./routes/about');
const settingsRoutes = require('./routes/settings');
const downloadPdfRoutes = require('./routes/downloadPdf');
const marqueeRoutes = require('./routes/marquee');
const whoWeAreRoutes = require('./routes/whoWeAre');
const featuredServicesRoutes = require('./routes/featuredServices');
const glimpseRoutes = require('./routes/glimpse');
const clientRoutes = require('./routes/client');
const parallaxRoutes = require('./routes/parallax');
const testimonialsRoutes = require('./routes/testimonials');
const countersRoutes = require('./routes/counters');
const blogsRoutes = require('./routes/blogs');
const globalPlatformRoutes = require('./routes/globalPlatform');
const visionMissionRoutes = require('./routes/visionMission');
const whyAttendRoutes = require('./routes/whyAttend');
const whoShouldAttendRoutes = require('./routes/whoShouldAttend');
const organizedByRoutes = require('./routes/organizedBy');
const whyExhibitRoutes = require('./routes/whyExhibit');
const stallVendorRoutes = require('./routes/stallVendor');
const exhibitorRoutes = require('./routes/exhibitor');
const advisoryRoutes = require('./routes/advisory');
const galleryRoutes = require('./routes/gallery');
const contactEnquiryRoutes = require('./routes/contactEnquiry');
const sitemapRoutes = require('./routes/sitemap');
const socialMediaRoutes = require('./routes/socialMedia');
const exhibitorRegistrationRoutes = require('./routes/exhibitorRegistration');
const stallRoutes = require('./routes/stalls');
const eventRoutes = require('./routes/events');
const stallRateRoutes = require('./routes/stallRates');
const termsAndConditionsRoutes = require('./routes/termsAndConditions');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Razorpay Webhook - must be before bodyParser (needs raw body)
app.use('/api/payment/webhook', require('./routes/payment'));

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/temp', express.static('temp'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// Dynamic Sitemap Route
app.use('/sitemap.xml', sitemapRoutes);

// Serve SEO files from root (e.g., /sitemap.xml)
app.use(async (req, res, next) => {
    try {
        const SeoFile = require('./models/SeoFile');
        const filename = req.path.substring(1); // Remove leading slash
        if (filename && !filename.includes('/')) {
            const seoFile = await SeoFile.findOne({ originalName: filename });
            if (seoFile) {
                const path = require('path');
                const fs = require('fs');
                const filePath = path.join(__dirname, seoFile.path.startsWith('/') ? seoFile.path.substring(1) : seoFile.path);
                if (fs.existsSync(filePath)) {
                    return res.sendFile(filePath);
                }
            }
        }
        next();
    } catch (error) {
        next();
    }
});


// Basic Route
app.get('/', (req, res) => {
    res.send('IHWE Backend is running...');
});

// Test Route
app.get('/api/whoami', (req, res) => {
    res.json({ success: true, server: 'IHWE-ROOT-BACKEND', message: 'I am running from c:\\Users\\PC\\Desktop\\IHWE\\backend' });
});

// Test Route
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Correct server is running (IHWE/backend)' });
});

// Auth Routes (Modular)
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

// API Routes
app.use('/api/sidebar', sidebarRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/admin', adminUsersRoutes);
app.use('/api/event-highlights', eventHighlightsRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/download-pdf', downloadPdfRoutes);
app.use('/api/marquee', marqueeRoutes);
app.use('/api/who-we-are', whoWeAreRoutes);
app.use('/api/featured-services', featuredServicesRoutes);
app.use('/api/glimpse', glimpseRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/parallax', parallaxRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/counters', countersRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/global-platform', globalPlatformRoutes);
app.use('/api/vision-mission', visionMissionRoutes);
app.use('/api/why-attend', whyAttendRoutes);
app.use('/api/who-should-attend', whoShouldAttendRoutes);
app.use('/api/organized-by', organizedByRoutes);
app.use('/api/why-exhibit-manage', whyExhibitRoutes);
app.use('/api/seo', require('./routes/seo'));
app.use('/api/seo-settings', require('./routes/seoSettings.js'));
app.use('/api/why-exhibit', require('./routes/whyExhibit'));
app.use('/api/why-visit', require('./routes/whyVisit'));
app.use('/api/hero-background', require('./routes/heroBackground'));
app.use('/api/exhibitor-profile', require('./routes/exhibitorProfile'));
app.use('/api/e-promotion', require('./routes/ePromotion'));
app.use('/api/stall-vendor', stallVendorRoutes);
app.use('/api/partners', require('./routes/partners'));
app.use('/api/exhibitor', exhibitorRoutes);
app.use('/api/advisory-members', advisoryRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/contact-enquiry', contactEnquiryRoutes);
app.use('/api/buyer-registration', require('./routes/buyerRegistration'));
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/verify', require('./routes/verify'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/exhibitor-registration', exhibitorRegistrationRoutes);
app.use('/api/exhibitor-auth', require('./routes/exhibitorAuth'));
app.use('/api/stalls', stallRoutes);
app.use('/api/payment', require('./routes/payment'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/events', eventRoutes);
app.use('/api/stall-rates', stallRateRoutes);
app.use('/api/terms-and-conditions', termsAndConditionsRoutes);
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});