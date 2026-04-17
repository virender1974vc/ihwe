const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require('multer');
const path = require("path");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();


const sidebarRoutes = require("./routes/sidebar");
const rolesRoutes = require("./routes/roles");
const heroRoutes = require("./routes/hero");
const adminUsersRoutes = require("./routes/adminUsers");
const eventHighlightsRoutes = require("./routes/eventHighlights");
const aboutRoutes = require("./routes/about");
const settingsRoutes = require("./routes/settings");
const downloadPdfRoutes = require("./routes/downloadPdf");
const marqueeRoutes = require("./routes/marquee");
const whoWeAreRoutes = require("./routes/whoWeAre");
const featuredServicesRoutes = require("./routes/featuredServices");
const faqRoutes = require("./routes/faq");
const glimpseRoutes = require("./routes/glimpse");
const clientRoutes = require("./routes/client");
const parallaxRoutes = require("./routes/parallax");
const testimonialsRoutes = require("./routes/testimonials");
const countersRoutes = require("./routes/counters");
const blogsRoutes = require("./routes/blogs");
const globalPlatformRoutes = require("./routes/globalPlatform");
const visionMissionRoutes = require("./routes/visionMission");
const whyAttendRoutes = require("./routes/whyAttend");
const whoShouldAttendRoutes = require("./routes/whoShouldAttend");
const organizedByRoutes = require("./routes/organizedBy");
const whyExhibitRoutes = require("./routes/whyExhibit");
const stallVendorRoutes = require("./routes/stallVendor");
const exhibitorRoutes = require("./routes/exhibitor");
const advisoryRoutes = require("./routes/advisory");
const galleryRoutes = require("./routes/gallery");
const galleryCategoryRoutes = require('./routes/galleryCategory');
const contactEnquiryRoutes = require("./routes/contactEnquiry");
const sitemapRoutes = require("./routes/sitemap");
const socialMediaRoutes = require("./routes/socialMedia");
const travelAccommodationRoutes = require("./routes/travelAccommodationRoutes");
const exhibitorRegistrationRoutes = require('./routes/exhibitorRegistration');
const stallRoutes = require('./routes/stalls');
const eventRoutes = require('./routes/events');
const stallRateRoutes = require('./routes/stallRates');
const termsAndConditionsRoutes = require('./routes/termsAndConditions');
const dashboardRoutes = require('./routes/dashboard');


const bankListRoutes = require("./routes/bankListRoutes");
const bankOptionRoutes = require("./routes/bankOptionRoutes");
const commonWhatsappRoutes = require("./routes/commonWhatsappRoutes");
const crmCityRoutes = require("./routes/crmCityRoutes");
const crmCountryRoutes = require("./routes/crmCountryRoutes");
const crmEventRoutes = require("./routes/crmEventRoutes");
const crmExhibatorReviewRoutes = require("./routes/crmExhibatorReviewRoutes");
const crmExhibitorCategoryRoutes = require("./routes/crmExhibitorCategoryRoutes");
const crmLoginLogRoutes = require("./routes/crmLoginLogRoutes");
const crmLpu2018Routes = require("./routes/crmLpu2018Routes");
const natureOfBusinessRoutes = require("./routes/natureOfBusinessRoutes");
const dataSourceRoutes = require("./routes/dataSourceRoutes");
const crmStateRoutes = require("./routes/crmStateRoutes");
const crmUserRoutes = require("./routes/crmUserRoutes");
const companyRoutes = require("./routes/companyRoutes");
const statusOptionRoutes = require("./routes/add_by_admin/statusOptionRoutes");
const whatsappMessageRoutes = require("./routes/add_by_admin/CRMwhatsappMessageRoutes");
const loginRoutes = require("./routes/loginRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const estimateRoutes = require("./routes/estimateRoutes");
const perInvoiceRoutes = require("./routes/perInvoiceRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const creditNoteRoutes = require("./routes/creditNoteRoutes");
const activityLogRoutes = require("./routes/activity/activityLogRoutes");
const corporateVisitorRoutes = require("./routes/visitor/corporateVisitorRoutes");
const generalVisitorRoutes = require("./routes/visitor/generalVisitorRoutes");
const freeHealthCampRoutes = require("./routes/visitor/freeHealthCampRoutes");
const visitorReviewRoutes = require("./routes/visitor/visitorReviewRoutes");
const serviceDetailRoutes = require("./routes/serviceDetailRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const contactRoutes = require("./routes/contactRoutes");
const vacancyRoutes = require("./routes/vacancyRoutes");
const careerRoutes = require("./routes/careerRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const leadRoutes = require("./routes/leadRoutes");
const visitorAuthRoutes = require("./routes/visitor/visitorAuthRoutes");
const annualTurnoverRoutes = require("./routes/add_by_admin/AnnualTurnoverRoutes");
const businessTypeRoutes = require("./routes/add_by_admin/BusinessType");
const meetingPriorityLevelRoutes = require("./routes/add_by_admin/MeetingPriorityLevelRoutes");
const primaryProductInterestsRoutes = require("./routes/add_by_admin/primaryProductInterestsRoutes");
const stallAccessoryRoutes = require('./routes/stallAccessoryRoutes');
const secondaryProductRoutes = require("./routes/add_by_admin/SecondaryProductRoutes");

mongoose
  .connect(process.env.MONGO_URI_MAIN, {
    // optional options (remove if not needed)
  })
  .then(() => console.log("✅ Connected to MAIN MongoDB (default connection)"))
  .catch((err) => console.error("❌ MAIN DB connection error:", err));
global.secondaryDB = mongoose;
const app = express();
const PORT = process.env.PORT || 5000;
app.use('/api/payment/webhook', require('./routes/payment'));

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use('/temp', express.static('temp', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
        }
    }
}));

// SEO file serving middleware
app.use("/sitemap.xml", sitemapRoutes);
app.use(async (req, res, next) => {
  try {
    const SeoFile = require("./models/SeoFile");
    const filename = req.path.substring(1);
    if (filename && !filename.includes("/")) {
      const seoFile = await SeoFile.findOne({ originalName: filename });
      if (seoFile) {
        const fs = require("fs");
        const filePath = path.join(
          __dirname,
          seoFile.path.startsWith("/")
            ? seoFile.path.substring(1)
            : seoFile.path,
        );
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


app.get("/", (req, res) => {
  res.send("IHWE Backend is running...");
});

app.get("/api/whoami", (req, res) => {
  res.json({
    success: true,
    server: "IHWE-ROOT-BACKEND",
    message: "I am running from " + __dirname,
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Correct server is running (IHWE/backend)",
  });
});


const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);
app.use("/api/sidebar", sidebarRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/hero", heroRoutes);
app.use("/api/admin", adminUsersRoutes);
app.use("/api/event-highlights", eventHighlightsRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/download-pdf", downloadPdfRoutes);
app.use("/api/marquee", marqueeRoutes);
app.use("/api/who-we-are", whoWeAreRoutes);
app.use("/api/featured-services", featuredServicesRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/glimpse", glimpseRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/parallax", parallaxRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/counters", countersRoutes);
app.use("/api/blogs", blogsRoutes);
app.use("/api/global-platform", globalPlatformRoutes);
app.use("/api/vision-mission", visionMissionRoutes);
app.use("/api/why-attend", whyAttendRoutes);
app.use("/api/who-should-attend", whoShouldAttendRoutes);
app.use("/api/organized-by", organizedByRoutes);
app.use("/api/why-exhibit-manage", whyExhibitRoutes);
app.use("/api/seo", require("./routes/seo"));
app.use("/api/seo-settings", require("./routes/seoSettings.js"));
app.use("/api/why-exhibit", require("./routes/whyExhibit"));
app.use("/api/why-visit", require("./routes/whyVisit"));
app.use("/api/hero-background", require("./routes/heroBackground"));
app.use("/api/exhibitor-profile", require("./routes/exhibitorProfile"));
app.use("/api/e-promotion", require("./routes/ePromotion"));
app.use("/api/stall-vendor", stallVendorRoutes);
app.use("/api/partners", require("./routes/partners"));
app.use("/api/exhibitor", exhibitorRoutes);
app.use("/api/advisory-members", advisoryRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/gallery-category", galleryCategoryRoutes);
app.use("/api/contact-enquiry", contactEnquiryRoutes);
app.use("/api/speaker-nomination", require("./routes/speakerRoutes"));
app.use("/api/buyer-registration", require("./routes/buyerRegistration"));
app.use("/api/social-media", socialMediaRoutes);
app.use("/api/travel-accommodation", require("./routes/travelAccommodationRoutes"));
app.use("/api/verify", require("./routes/verify"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/otp", require("./routes/otpRoutes"));
app.use('/api/exhibitor-registration', exhibitorRegistrationRoutes);
app.use('/api/exhibitor-auth', require('./routes/exhibitorAuth'));
app.use('/api/buyer-auth', require('./routes/buyerAuth'));
app.use('/api/stalls', stallRoutes);
app.use('/api/payment', require('./routes/payment'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/events', eventRoutes);
app.use('/api/stall-rates', stallRateRoutes);
app.use('/api/terms-and-conditions', termsAndConditionsRoutes);
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/policies', require('./routes/policyRoutes'));

app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/banks", bankListRoutes);
app.use("/api/bank-options", bankOptionRoutes);
app.use("/api/whatsapp", commonWhatsappRoutes);
app.use("/api/crm-cities", crmCityRoutes);
app.use("/api/crm-countries", crmCountryRoutes);
app.use("/api/crm-events", crmEventRoutes);
app.use("/api/crm-exhibator-reviews", crmExhibatorReviewRoutes);
app.use("/api/crm-exhibitor-categories", crmExhibitorCategoryRoutes);
app.use("/api/crm-login-logs", crmLoginLogRoutes);
app.use("/api/crm-lpu2018", crmLpu2018Routes);
app.use("/api/nature-of-business", natureOfBusinessRoutes);
app.use("/api/data-source", dataSourceRoutes);
app.use("/api/crm-states", crmStateRoutes);
app.use("/api/users", crmUserRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/status-option", statusOptionRoutes);
app.use("/api/crm-messages", whatsappMessageRoutes);
app.use("/api", loginRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/estimates", estimateRoutes);
app.use("/api/perinvoice", perInvoiceRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/creditnotes", creditNoteRoutes);
app.use("/api/corporate-visitors", corporateVisitorRoutes);
app.use("/api/general-visitors", generalVisitorRoutes);
app.use("/api/health-camp-visitors", freeHealthCampRoutes);
app.use("/api/service-details", serviceDetailRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/vacancies", vacancyRoutes);
app.use("/api/career", careerRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/visitor-reviews", visitorReviewRoutes);
app.use("/api/visitor-auth", visitorAuthRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/sidebar-theme", require("./routes/sidebarThemeRoutes"));
app.use("/api/custom-pages", require("./routes/customPageRoutes"));
app.use("/api/pdf-manager", require("./routes/pdfManagerRoutes"));
app.use("/api/portfolio-gallery", require("./routes/portfolioGalleryRoutes"));
app.use("/api/email-logs", require("./routes/emailLogRoutes"));
app.use("/api/whatsapp-logs", require("./routes/whatsAppLogRoutes"));
app.use("/api/message-templates", require("./routes/messageTemplateRoutes"));
app.use("/api/business-types", businessTypeRoutes);
app.use("/api/annual-turnovers", annualTurnoverRoutes);
app.use("/api/meeting-priorities", meetingPriorityLevelRoutes);
app.use("/api/primary-products", primaryProductInterestsRoutes);
app.use("/api/secondary-products", secondaryProductRoutes);
app.use("/api/stall-accessories", stallAccessoryRoutes);
app.use("/api/exchange-rate", require('./routes/exchangeRateRoutes'));
app.use("/api/chat", require('./routes/chatRoutes'));

// ── Socket.io setup ───────────────────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const ChatMessage = require('./models/ChatMessage');

// Track online users: socketId → { userId, userType, roomId, userName }
const onlineUsers = new Map();
// Track roomId → Set of socketIds
const roomSockets = new Map();

io.on('connection', (socket) => {

    // Join a chat room
    socket.on('join_room', ({ roomId, userId, userType, userName }) => {
        socket.join(roomId);
        onlineUsers.set(socket.id, { userId, userType, roomId, userName });
        if (!roomSockets.has(roomId)) roomSockets.set(roomId, new Set());
        roomSockets.get(roomId).add(socket.id);

        // Tell everyone in room this user is online
        io.to(roomId).emit('user_status', { userId, userType, userName, online: true });
    });

    // Admin joins global notification room
    socket.on('join_admin', ({ adminId, adminName } = {}) => {
        socket.join('admin_room');
        if (adminName) socket.join(`admin_room_${adminName.toLowerCase()}`);
        if (adminId) onlineUsers.set(socket.id, { userId: adminId, userType: 'admin', roomId: 'admin_room', userName: adminName || 'Admin' });
    });

    // Send message
    socket.on('send_message', async ({ roomId, exhibitorRegistrationId, exhibitorName, senderType, senderId, senderName, message }) => {
        if (mongoose.connection.readyState !== 1) return;
        try {
            // Check if the other party is currently in the room (for instant read)
            const roomSocketIds = roomSockets.get(roomId) || new Set();
            const otherOnline = [...roomSocketIds].some(sid => {
                const u = onlineUsers.get(sid);
                return u && u.userId !== senderId;
            });

            const msg = await ChatMessage.create({
                roomId, exhibitorRegistrationId, exhibitorName,
                senderType, senderId, senderName, message,
                readByExhibitor: senderType === 'exhibitor' || otherOnline,
                readByAdmin: senderType === 'admin' || otherOnline,
            });

            // Broadcast to room
            io.to(roomId).emit('receive_message', msg);

            // If other party is online, send seen_update back to sender
            if (otherOnline) {
                io.to(roomId).emit('messages_seen', { roomId, seenBy: senderType === 'admin' ? 'exhibitor' : 'admin' });
            }

            // Notify specific admin sidebar
            const ExhibitorRegistration = require('./models/ExhibitorRegistration');
            const exhibitor = await ExhibitorRegistration.findById(exhibitorRegistrationId).select('spokenWith');
            const targetRoom = (exhibitor && exhibitor.spokenWith) ? `admin_room_${exhibitor.spokenWith.toLowerCase()}` : 'admin_room';

            io.to(targetRoom).emit('room_updated', {
                roomId, exhibitorName, lastMessage: message,
                lastMessageAt: msg.createdAt, lastSenderType: senderType,
                unreadIncrement: senderType === 'exhibitor' && !otherOnline ? 1 : 0,
                spokenWith: exhibitor?.spokenWith || ''
            });
        } catch (err) {
            console.error('Chat save error:', err.message);
        }
    });

    // Mark messages as read — emit seen update to room
    socket.on('mark_read', async ({ roomId, readerType }) => {
        // Wait for DB to be ready (readyState 1 = connected)
        if (mongoose.connection.readyState !== 1) return;
        try {
            if (readerType === 'admin') {
                await ChatMessage.updateMany({ roomId, senderType: 'exhibitor', readByAdmin: false }, { readByAdmin: true });
            } else {
                await ChatMessage.updateMany({ roomId, senderType: 'admin', readByExhibitor: false }, { readByExhibitor: true });
            }
            io.to(roomId).emit('messages_seen', { roomId, seenBy: readerType });
        } catch (err) {
            console.error('mark_read error:', err.message);
        }
    });

    // Typing — room-scoped, only to others in room
    socket.on('typing', ({ roomId, senderType, senderName }) => {
        socket.to(roomId).emit('typing', { senderType, senderName, roomId });
    });
    socket.on('stop_typing', ({ roomId }) => {
        socket.to(roomId).emit('stop_typing', { roomId });
    });

    socket.on('disconnect', () => {
        const user = onlineUsers.get(socket.id);
        if (user && user.roomId !== 'admin_room') {
            io.to(user.roomId).emit('user_status', { userId: user.userId, userType: user.userType, online: false });
            const rs = roomSockets.get(user.roomId);
            if (rs) { rs.delete(socket.id); if (rs.size === 0) roomSockets.delete(user.roomId); }
        }
        onlineUsers.delete(socket.id);
    });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} with Socket.io`);
});
