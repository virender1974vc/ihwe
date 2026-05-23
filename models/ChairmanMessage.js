const mongoose = require('mongoose');

const chairmanMessageSchema = new mongoose.Schema({
    title: {
        type: String,
        default: "Chairman's Message"
    },
    heading: {
        type: String,
        default: "Leading Together for a Healthier Tomorrow"
    },
    description: {
        type: String,
        default: "At IHWE Expo 2026, our Advisory Board plays a pivotal role in driving our mission forward. Their expertise, global perspective, and commitment to innovation guide us in creating a world-class platform that empowers the health and wellness ecosystem."
    },
    signatureName: {
        type: String,
        default: "Vijay Sharma"
    },
    chairmanName: {
        type: String,
        default: "Mr. Vijay Sharma"
    },
    chairmanDesignation: {
        type: String,
        default: "Chairman, IHWE Expo 2026"
    },
    photo: {
        type: String,
        default: "/advisory/vijay.png"
    },
    visionText: {
        type: String,
        default: "A global platform for collaboration, innovation and impact in health & wellness."
    }
}, { timestamps: true });

module.exports = mongoose.model('ChairmanMessage', chairmanMessageSchema);
