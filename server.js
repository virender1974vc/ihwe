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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

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

// Register API Route (To create first admin)
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Missing username or password' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const newUser = new User({ username, password, role: 'Super Admin' });
        await newUser.save();
        res.status(201).json({ success: true, message: 'Admin created successfully', user: { username: newUser.username } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Login API Route
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Missing username or password' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'ihwe_secret_2026',
            { expiresIn: '24h' }
        );

        // Update lastLogin
        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                _id: user._id,
                username: user.username,
                role: user.role,
                mobile: user.mobile || ''
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Logout API (optional — for token blacklisting in future)
app.post('/api/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// Verify Token Route — called on every page refresh to check session validity
app.get('/api/verify-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ihwe_secret_2026');
        res.json({ success: true, user: decoded });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token expired or invalid' });
    }
});

// Middleware to verify JWT token for protected routes
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ihwe_secret_2026');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token expired or invalid' });
    }
};

// Change Credentials Route (Username & Password)
app.put('/api/admin/change-password', verifyToken, async (req, res) => {
    try {
        const { adminId, currentPassword, newPassword, newUsername } = req.body;

        if (!adminId || !currentPassword) {
            return res.status(400).json({ success: false, message: 'Missing required fields (adminId & currentPassword)' });
        }

        // Security check: only allow users to change their own password
        // Unless it's a Super Admin (you can extend this logic if needed)
        if (req.user.id !== adminId && req.user.role !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized to change this password' });
        }

        if (!newPassword && !newUsername) {
            return res.status(400).json({ success: false, message: 'Provide at least a new password or a new username' });
        }

        const user = await User.findById(adminId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid current password' });
        }

        // Update fields if provided
        if (newUsername) {
            // Check if username already exists
            const existingUser = await User.findOne({ username: newUsername });
            if (existingUser && existingUser._id.toString() !== adminId) {
                return res.status(409).json({ success: false, message: 'Username already taken' });
            }
            user.username = newUsername;
        }

        if (newPassword) {
            user.password = newPassword;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Credentials updated successfully',
            user: { username: user.username }
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

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


app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});