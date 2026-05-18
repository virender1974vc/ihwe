const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    logo: {
        type: String,
        default: ""
    },
    emails: [{
        email: String,
        forTopbar: { type: Boolean, default: false },
        forContact: { type: Boolean, default: false }
    }],
    phones: [{
        phone: String,
        forTopbar: { type: Boolean, default: false },
        forContact: { type: Boolean, default: false }
    }],
    addresses: [{
        title: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    }],
    mapIframe: {
        type: String,
        default: ""
    },
    marqueeText: {
        type: String,
        default: "• 150+ Speakers confirmed • Early Bird discount ending soon! • Join 8,000+ Professionals from 25+ Countries"
    },
    topbarDate: {
        type: String,
        default: "15–17 October 2026"
    },
    headerScripts: {
        type: String,
        default: ""
    },
    footerScripts: {
        type: String,
        default: ""
    },
    supportDeskText: {
        type: String,
        default: "For exhibitors and delegates traveling from abroad, our international support team is available 24/7 during the expo period for visa, travel, and logistics assistance."
    },
    onlineAdvancePercentage: {
        type: Number,
        default: 50
    },
    manualAdvancePercentage: {
        type: Number,
        default: 50
    },
    quickLinks: [{
        label: String,
        href: String
    }],
    exhibitionLinks: [{
        label: String,
        href: String
    }],
    exhibitorBrochurePdf: {
        type: String,
        default: ""
    },
    domesticRegistrationFormPdf: {
        type: String,
        default: ""
    },
    internationalRegistrationFormPdf: {
        type: String,
        default: ""
    },
    sponsorshipDeckPdf: {
        type: String,
        default: ""
    },
    // --- Corporate & Financial Settings (New) ---
    companyName: {
        type: String,
        default: "Namo Gange Wellness Pvt. Ltd."
    },
    companyAddress: {
        type: String,
        default: "12/29, Site-II, Loni Road, Industrial Area, Mohan Nagar, Ghaziabad, India"
    },
    companyGst: {
        type: String,
        default: ""
    },
    companyCin: {
        type: String,
        default: ""
    },
    authorizedSignature: {
        type: String,
        default: ""
    },
    companyStamp: {
        type: String,
        default: ""
    },
    fullPaymentDiscount: {
        type: Number,
        default: 5
    },
    availableTdsRates: {
        type: [Number],
        default: [1, 2, 10]
    },
    msmeLogos: [{
        imageUrl: {
            type: String,
            required: true
        },
        title: {
            type: String,
            default: "Partner Logo"
        },
        category: {
            type: String,
            default: "Supported By"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        displayOrder: {
            type: Number,
            default: 0
        }
    }],
    isMsmeLogoActive: {
        type: Boolean,
        default: true
    },
    floatingVideoTimer: {
        type: Number,
        default: 7
    },
    showBrochurePopUp: {
        type: Boolean,
        default: true
    },
    brochurePopUpDelay: {
        type: Number,
        default: 7
    },
    showGovtPmsScheme: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });


module.exports = mongoose.model('Settings', settingsSchema);
