const { Expo } = require('expo-server-sdk');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');

const expo = new Expo();

async function sendExhibitorPush(exhibitorId, title, body, data = {}) {
    try {
        const exhibitor = await ExhibitorRegistration.findById(exhibitorId)
            .select('expoPushTokens')
            .lean();
        const messages = (exhibitor?.expoPushTokens || [])
            .filter(token => Expo.isExpoPushToken(token))
            .map(to => ({ to, sound: 'default', title, body, data }));
        for (const chunk of expo.chunkPushNotifications(messages)) {
            await expo.sendPushNotificationsAsync(chunk);
        }
    } catch (error) {
        console.error('Exhibitor push notification failed:', error.message);
    }
}

module.exports = { sendExhibitorPush };
