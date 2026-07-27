const mongoose = require('mongoose');
require('dotenv').config();
const ExhibitorPassConfig = require('./models/ExhibitorPassConfig');

mongoose.connect(process.env.MONGO_URI_MAIN || process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        const passes = [
            {
                passType: 'lunch',
                title: 'Packed Thali Lunch',
                subtitle: 'Additional Lunch Pass (Per Day)',
                complimentaryQuota: 2,
                totalQuota: 100,
                price: 500,
                currency: 'INR',
                maxPerRequest: 10,
                gstPercentage: 5,
                displayOrder: 5
            },
            {
                passType: 'water',
                title: 'Water Bottle',
                subtitle: 'Additional Water Bottle',
                complimentaryQuota: 2,
                totalQuota: 500,
                price: 20,
                currency: 'INR',
                maxPerRequest: 50,
                gstPercentage: 18,
                displayOrder: 6
            },

            {
                passType: 'delegate',
                title: 'Delegate Pass',
                subtitle: 'For Conference Access',
                complimentaryQuota: 0,
                totalQuota: 500,
                price: 5000,
                currency: 'INR',
                maxPerRequest: 20,
                gstPercentage: 18,
                displayOrder: 8
            }
        ];

        for (let pass of passes) {
            await ExhibitorPassConfig.findOneAndUpdate(
                { passType: pass.passType },
                { $setOnInsert: pass },
                { upsert: true, returnDocument: 'after' }
            );
            console.log(`Ensured config for ${pass.passType}`);
        }

        console.log('Seeding complete.');
        process.exit(0);
    }).catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
