const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const http = require("http");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Ensure required upload directories exist
['uploads', 'uploads/marketing', 'temp', 'uploads/videos', 'uploads/exhibitor-testimonials'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Database Connection
mongoose
    .connect(process.env.MONGO_URI_MAIN, {})
    .then(() => console.log("✅ Connected to MAIN MongoDB (default connection)"))
    .catch((err) => console.error("❌ MAIN DB connection error:", err));
global.secondaryDB = mongoose;

const app = express();
const PORT = process.env.PORT || 5000;

// Webhook requires raw body, so define it before body parser
app.use('/api/payment/webhook', require('./routes/finance/payment'));

// Middleware setup
app.use(cors());
// const allowedOrigins = [
//   "https://ihwe.in",
//   "https://www.ihwe.in",
//   "https://api.ihwe.in",
//   "https://admin.ihwe.in",
//   "http://localhost:8080"
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // allow requests with no origin (like Postman / mobile apps)
//       if (!origin) return callback(null, true);

//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       } else {
//         console.warn(`⚠️ CORS blocked for origin: ${origin}`);
//         return callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true
//   })
// );

app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

// Static directories
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
const sitemapRoutes = require('./routes/misc/sitemap');
app.use("/sitemap.xml", sitemapRoutes);
app.use("/sitemap/xml", sitemapRoutes);

app.use(async (req, res, next) => {
    try {
        const SeoFile = require('./models/cms/SeoFile');
        const filename = req.path.substring(1);
        if (filename && !filename.includes("/")) {
            let seoFile = await SeoFile.findOne({ originalName: filename });
            if (!seoFile) {
                if (filename === "robots.txt") {
                    seoFile = await SeoFile.findOne({ originalName: /robots.*\.txt/i }) ||
                        await SeoFile.findOne({ originalName: /robots/i });
                } else if (filename === "sitemap.xml") {
                    seoFile = await SeoFile.findOne({ originalName: /sitemap.*\.xml/i }) ||
                        await SeoFile.findOne({ originalName: /sitemap/i });
                }
            }
            if (seoFile) {
                const filePath = path.join(__dirname, seoFile.path.startsWith("/") ? seoFile.path.substring(1) : seoFile.path);
                if (fs.existsSync(filePath)) {
                    return res.sendFile(filePath);
                }
            }
        }
        if (req.path === "/robots.txt") {
            res.header("Content-Type", "text/plain");
            return res.send("User-agent: *\nAllow: /");
        }
        next();
    } catch (error) {
        next();
    }
});

// Basic Root Routes
app.get("/", (req, res) => res.send("IHWE Backend is running..."));
app.get("/api/whoami", (req, res) => res.json({ success: true, server: "IHWE-ROOT-BACKEND", message: "I am running from " + __dirname }));
app.get("/api/test", (req, res) => res.json({ success: true, message: "Correct server is running (IHWE/backend)" }));

// ── API Routes (Centralized) ──────────────────────────────────────────────────
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// ── Error Handling Middleware ─────────────────────────────────────────────────
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Endpoint not found" });
});

app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ── Initialize Server & Socket.io ──────────────────────────────────────────────
const httpServer = http.createServer(app);
const { initSocket } = require('./services/misc/socketService');
initSocket(httpServer);

// ── Initialize Cron Jobs ──────────────────────────────────────────────────────
const { initPaymentWarningCron } = require('./jobs/paymentWarningCron');
initPaymentWarningCron();

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} with Socket.io`);
    // Start IMAP email reply poller
    const { startImapPoller } = require('./services/misc/imapPollerService');
    startImapPoller();
});
