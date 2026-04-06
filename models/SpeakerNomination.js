const mongoose = require('mongoose');

const speakerNominationSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        enum: ['dr', 'prof', 'mr', 'ms', 'mrs']
    },
    firstName: { 
        type: String, 
        required: true,
        trim: true
    },
    lastName: { 
        type: String, 
        required: true,
        trim: true
    },
    officialEmail: { 
        type: String, 
        required: true,
        trim: true,
        lowercase: true
    },
    mobileNo: { 
        type: String, 
        required: true,
        trim: true
    },
    linkedinUrl: { 
        type: String, 
        required: true,
        trim: true
    },
    organizationName: { 
        type: String, 
        required: true,
        trim: true
    },
    designation: { 
        type: String, 
        required: true,
        trim: true
    },
    areaOfExpertise: { 
        type: String, 
        required: true,
        trim: true
    },
    country: { 
        type: String, 
        required: true,
        trim: true
    },
    state: { 
        type: String, 
        required: true,
        trim: true
    },
    city: { 
        type: String, 
        required: true,
        trim: true
    },
    proposedTopic: { 
        type: String, 
        required: true,
        trim: true
    },
    shortBiography: { 
        type: String, 
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Accepted', 'Rejected'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SpeakerNomination', speakerNominationSchema);
