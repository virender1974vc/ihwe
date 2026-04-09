const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require('multer');
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// ----------------------------------------------
// Existing routes (CommonJS)
// ----------------------------------------------
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

// New CRM routes (converted to CommonJS)
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

// ----------------------------------------------
// MongoDB Connections
// ----------------------------------------------
// 1. Main Database – used as default connection
//    All existing models (which use `mongoose.model`) will connect here.
mongoose
  .connect(process.env.MONGO_URI_MAIN, {
    // optional options (remove if not needed)
  })
  .then(() => console.log("✅ Connected to MAIN MongoDB (default connection)"))
  .catch((err) => console.error("❌ MAIN DB connection error:", err));
global.secondaryDB = mongoose;

// ----------------------------------------------
// Express App
// ----------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// Razorpay Webhook - must be before bodyParser (needs raw body)
app.use('/api/payment/webhook', require('./routes/payment'));

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use('/temp', express.static('temp'));

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

// Root routes
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

// ----------------------------------------------
// Existing API routes (all use default/main DB)
// ----------------------------------------------
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
// ----------------------------------------------
// New CRM routes (some may need secondary DB)
// Note: If any of these routes should use the secondary database,
//       you must ensure their models are defined using `secondaryDB`.
//       For now, they are using the default connection.
// ----------------------------------------------
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
app.use("/api/settings", settingsRoutes);
app.use("/api/sidebar-theme", require("./routes/sidebarThemeRoutes"));
app.use("/api/custom-pages", require("./routes/customPageRoutes"));
app.use("/api/pdf-manager", require("./routes/pdfManagerRoutes"));
app.use("/api/portfolio-gallery", require("./routes/portfolioGalleryRoutes"));
app.use("/api/email-logs", require("./routes/emailLogRoutes"));
app.use("/api/whatsapp-logs", require("./routes/whatsAppLogRoutes"));
app.use("/api/message-templates", require("./routes/messageTemplateRoutes"));

// ----------------------------------------------
// Start Server
// ----------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
