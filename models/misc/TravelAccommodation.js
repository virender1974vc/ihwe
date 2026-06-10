const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
    image: { type: String, required: true },
    title: { type: String, required: true },
    tag: { type: String }, // e.g., "Most Popular", "Business Choice"
    distance: { type: String, required: true },
    rate: { type: String, required: true }, // e.g., "₹12,500/night"
    stars: { type: Number, default: 5 },
    bookingUrl: { type: String },
    alt: { type: String } // SEO improvement requested
});

const commuteSchema = new mongoose.Schema({
    icon: { type: String, required: true }, // Lucide icon name
    title: { type: String, required: true },
    description: { type: String, required: true }
});

const travelAccommodationSchema = new mongoose.Schema({
    // ── SECTION HEADINGS ──
    venueHeading: { type: String, default: "Venue Location" },
    mapIframe: { type: String }, 
    
    commuteHeading: { type: String, default: "Commute Options" },
    commuteSubtitle: { type: String, default: "How to reach the venue" },
    
    accommodationHeading: { type: String, default: "Accommodation Options" },
    accommodationSubtitle: { type: String, default: "Enjoy a comfortable stay near the venue." },
    
    // ── DATA LISTS ──
    commuteOptions: [commuteSchema],
    hotelOptions: [hotelSchema],
    
    // ── CONCIERGE / HELP ──
    helpHeading: { type: String, default: "Need Help Booking?" },
    helpDescription: { type: String, default: "For travel assistance, group bookings, or hotel recommendations..." },
    contactEmail: { type: String, default: "travel@ihwe.com" },
    contactPhone: { type: String, default: "+91-98765-43210" }
}, { timestamps: true });

module.exports = mongoose.model("TravelAccommodation", travelAccommodationSchema);
