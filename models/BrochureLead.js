const mongoose = require('mongoose');

const brochureLeadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    company: { type: String, required: true },
    phone: { type: String, required: true },
    interest: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BrochureLead', brochureLeadSchema);
