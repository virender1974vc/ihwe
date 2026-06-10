require('dotenv').config();
const mongoose = require('mongoose');
const TermAndCondition = require('./models/TermAndCondition');

const seedTerms = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const Event = require('./models/Event');
        const events = await Event.find({ status: 'active' });
        
        if (events.length === 0) {
            console.log('No active events found. Please create an event first before seeding terms.');
            process.exit(1);
        }

        const baseTerms = [
            {
                pageName: 'exhibitor-registration',
                title: 'Exhibitor Terms and Conditions',
                content: '<p>1. <strong>Compliance:</strong> The exhibitor agrees to abide by all the rules and regulations set forth by the IHWE organizers.</p><p>2. <strong>Payment Schedule:</strong> Payment must be made as per the recommended schedule. Stalls are only confirmed upon receiving the required payment.</p><p>3. <strong>Usage of Space:</strong> Stalls cannot be sublet, assigned, or shared with any third party without prior written consent from the organizers.</p><p>4. <strong>Modifications:</strong> The organizer reserves the right to alter the floor plan or change the stall allocations if deemed necessary for the overall benefit of the exhibition.</p><p>5. <strong>Security:</strong> While general security is provided, exhibitors are solely responsible for their goods and belongings within their stall area.</p>',
                status: 'Active'
            },
            {
                pageName: 'visitor-registration',
                title: 'Visitor Terms and Conditions',
                content: '<p>1. Visitor badges are non-transferable and must be worn at all times within the exhibition venue.</p><p>2. The organizer reserves the right of admission and may refuse entry to any individual.</p>',
                status: 'Active'
            },
            {
                pageName: 'terms-of-service',
                title: 'Terms of Service',
                content: '<p>Welcome to the International Health and Wellness Expo (IHWE) platform. By using this website, you agree to comply with our general Terms of Service.</p>',
                status: 'Active'
            }
        ];

        let termsToInsert = [];
        events.forEach(event => {
            baseTerms.forEach(term => {
                termsToInsert.push({
                    ...term,
                    eventId: event._id
                });
            });
        });

        await TermAndCondition.deleteMany({});
        try {
            await TermAndCondition.collection.dropIndex('pageName_1');
        } catch (e) {
            console.log('Index pageName_1 might not exist or already dropped.');
        }
        console.log('Cleared existing Terms and Conditions and dropped uniqueness on pageName');

        await TermAndCondition.insertMany(termsToInsert);
        console.log(`Terms and Conditions seeded successfully for ${events.length} events!`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding terms:', error);
        process.exit(1);
    }
};

seedTerms();
