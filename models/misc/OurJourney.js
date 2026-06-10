const mongoose = require('mongoose');

const OurJourneySchema = new mongoose.Schema({
    subtitle: {
        type: String,
        default: 'OUR JOURNEY & FLAGSHIP EVENTS'
    },
    mainTitle: {
        type: String,
        default: 'A Legacy of Growth & Innovation'
    },
    mainDescription: {
        type: String,
        default: 'With a proven legacy of delivering result-oriented exhibitions, we forge lasting business relationships and accelerate industry growth.'
    },
    // SECTION 1: Our Journey
    journeyHeading: {
        type: String,
        default: 'OUR JOURNEY: A LEGACY OF GROWTH'
    },
    journeyItems: [{
        year: String,
        text: String
    }],
    // SECTION 2: Core Sectors
    sectorsHeading: {
        type: String,
        default: 'DRIVING INNOVATION ACROSS CORE SECTORS'
    },
    sectorsItems: [{
        label: String,
        text: String
    }],
    // SECTION 3: Flagship Events
    eventsHeading: {
        type: String,
        default: 'FLAGSHIP EVENTS: A PROVEN TRACK RECORD'
    },
    eventsDescription: {
        type: String,
        default: "NGWPL's flagship events consistently deliver exceptional value and foster vibrant communities, creating significant market opportunities."
    },
    eventsList: {
        type: [String],
        default: []
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('OurJourney', OurJourneySchema);
