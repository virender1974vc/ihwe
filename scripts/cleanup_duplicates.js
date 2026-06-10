const mongoose = require('mongoose');
const ExhibitorRegistration = require('./models/ExhibitorRegistration');
require('dotenv').config();

async function cleanupDuplicates() {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('Connected to MongoDB...');

        const registrations = await ExhibitorRegistration.find({});
        console.log(`Checking ${registrations.length} registrations...`);

        const groups = {};
        registrations.forEach(reg => {
            const email = reg.contact1?.email?.toLowerCase().trim();
            const stall = reg.participation?.stallNo;
            if (!email || !stall) return;

            const key = `${email}-${stall}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(reg);
        });

        let deletedCount = 0;

        for (const key in groups) {
            const regs = groups[key];
            if (regs.length > 1) {
                console.log(`Found ${regs.length} records for ${key}`);
                
                // Sort by status priority: confirmed > paid > pending > failed
                regs.sort((a, b) => {
                    const priority = { 'confirmed': 1, 'paid': 2, 'advance-paid': 3, 'approved': 4, 'pending': 5, 'payment-failed': 6 };
                    const scoreA = priority[a.status] || 99;
                    const scoreB = priority[b.status] || 99;
                    
                    if (scoreA !== scoreB) return scoreA - scoreB;
                    return new Date(b.createdAt) - new Date(a.createdAt); // newest first
                });

                const keep = regs[0];
                const toDelete = regs.slice(1);

                console.log(`+ Keeping: ${keep._id} [Status: ${keep.status}]`);
                
                for (const d of toDelete) {
                    // Only delete IF it's not a successful one
                    if (!['paid', 'confirmed', 'advance-paid'].includes(d.status)) {
                        await ExhibitorRegistration.findByIdAndDelete(d._id);
                        console.log(`- Deleted duplicate: ${d._id} [Status: ${d.status}]`);
                        deletedCount++;
                    } else {
                        console.log(`! Skipping deletion of ${d._id} because status is ${d.status}`);
                    }
                }
            }
        }

        console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate failed entries.`);
        process.exit(0);
    } catch (err) {
        console.error('Cleanup Error:', err);
        process.exit(1);
    }
}

cleanupDuplicates();
