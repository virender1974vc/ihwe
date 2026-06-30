const mongoose = require('mongoose');
const DelegateDay = require('./models/DelegateDay');
const DelegateSession = require('./models/DelegateSession');
const DelegatePass = require('./models/DelegatePass');

require('dotenv').config({ path: '.env' });
mongoose.connect(process.env.MONGO_URI_MAIN || process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB. Starting seed...');

        // Clear existing data
        await DelegateDay.deleteMany({});
        await DelegateSession.deleteMany({});
        await DelegatePass.deleteMany({});

        // 1. Seed Days
        const day1 = await DelegateDay.create({ date: '21 AUG 2026', day: 'FRI', title: 'Healthcare Innovations', displayOrder: 1 });
        const day2 = await DelegateDay.create({ date: '22 AUG 2026', day: 'SAT', title: 'Medical Tourism & Tech', displayOrder: 2 });
        const day3 = await DelegateDay.create({ date: '23 AUG 2026', day: 'SUN', title: 'Future of Wellness', displayOrder: 3 });

        // 2. Seed Sessions
        const sessions = [
            // Day 1
            { dayId: day1._id, number: '1', time: '10:00 AM - 11:30 AM', title: 'Inauguration & Keynote', description: 'Opening ceremony and keynote speech on the future of healthcare.', price: 500, displayOrder: 1 },
            { dayId: day1._id, number: '2', time: '12:00 PM - 01:30 PM', title: 'AI in Diagnostics', description: 'Exploring the role of Artificial Intelligence in modern medical diagnostics.', price: 500, displayOrder: 2 },
            { dayId: day1._id, number: '3', time: '02:30 PM - 04:00 PM', title: 'Digital Health Records', description: 'The shift towards secure and interoperable digital health records.', price: 500, displayOrder: 3 },
            
            // Day 2
            { dayId: day2._id, number: '4', time: '10:00 AM - 11:30 AM', title: 'Global Medical Tourism', description: 'Trends and opportunities in the global medical tourism sector.', price: 500, displayOrder: 1 },
            { dayId: day2._id, number: '5', time: '12:00 PM - 01:30 PM', title: 'Robotics in Surgery', description: 'Advancements in robotic-assisted surgeries and their outcomes.', price: 500, displayOrder: 2 },
            { dayId: day2._id, number: '6', time: '02:30 PM - 04:00 PM', title: 'Telemedicine Revolution', description: 'How telemedicine is breaking geographical barriers in healthcare.', price: 500, displayOrder: 3 },
            
            // Day 3
            { dayId: day3._id, number: '7', time: '10:00 AM - 11:30 AM', title: 'Mental Health & Wellness', description: 'Integrating mental health into primary care models.', price: 500, displayOrder: 1 },
            { dayId: day3._id, number: '8', time: '12:00 PM - 01:30 PM', title: 'Nutrition and Longevity', description: 'Dietary interventions for increasing healthspan and longevity.', price: 500, displayOrder: 2 },
            { dayId: day3._id, number: '9', time: '02:30 PM - 04:00 PM', title: 'Closing Ceremony & Awards', description: 'Valedictory session and distribution of healthcare excellence awards.', price: 500, displayOrder: 3 },
        ];
        await DelegateSession.insertMany(sessions);

        // 3. Seed Passes
        const passes = [
            {
                passKey: 'all_day',
                title: 'ALL 3 SESSIONS',
                subtitle: '',
                price: 1200,
                perks: ['All Sessions Access', 'Delegate Kit', 'Certificate', 'Lunch (Thali)'],
                isActive: true
            },
            {
                passKey: 'full_pass',
                title: 'ALL 3 DAYS – FULL ACCESS PASS',
                subtitle: '(DAY 1 + DAY 2 + DAY 3)',
                price: 3000,
                perks: ['All Sessions (3 Days)', 'Delegate Kit', 'Certificate', 'Lunch (All Days)'],
                isActive: true
            },
            {
                passKey: 'paper_pass',
                title: 'PAPER PRESENTATION PASS',
                subtitle: '(ANY 1 DAY – 2 SESSIONS)',
                price: 3000,
                perks: ['Access to 2 Sessions', 'Presentation Opportunity', 'Certificate (Paper)', 'Lunch + Delegate Kit'],
                isActive: true
            }
        ];
        await DelegatePass.insertMany(passes);

        console.log('Seed completed successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Seed error:', err);
        process.exit(1);
    });
