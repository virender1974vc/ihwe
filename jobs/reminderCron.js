const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const { dispatchPushNotifications } = require('../controllers/reminderController');

// Run every minute
const initReminderCron = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            // Find all pending scheduled reminders where scheduledFor <= now
            const pendingReminders = await Reminder.find({
                type: 'scheduled',
                status: 'pending',
                scheduledFor: { $lte: now }
            });

            for (let reminder of pendingReminders) {
                // Dispatch notifications
                await dispatchPushNotifications(reminder);

                // Update status
                reminder.status = 'sent';
                await reminder.save();
                console.log(`Reminder ${reminder._id} dispatched via CRON.`);
            }
        } catch (error) {
            console.error('Error in reminder CRON job:', error);
        }
    });
};

module.exports = { initReminderCron };
