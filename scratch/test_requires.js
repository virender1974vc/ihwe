try {
    console.log('Testing node-cron...');
    require('node-cron');
    console.log('✅ node-cron found');
} catch (e) {
    console.log('❌ node-cron NOT found:', e.message);
}

try {
    console.log('Testing ExhibitorRegistration model...');
    require('../models/ExhibitorRegistration');
    console.log('✅ ExhibitorRegistration model found');
} catch (e) {
    console.log('❌ ExhibitorRegistration model NOT found:', e.message);
}

try {
    console.log('Testing emailService...');
    require('../utils/emailService');
    console.log('✅ emailService found');
} catch (e) {
    console.log('❌ emailService NOT found:', e.message);
    if (e.code === 'MODULE_NOT_FOUND') {
        console.log('Require Stack:', e.stack);
    }
}

try {
    console.log('Testing whatsappService...');
    require('../utils/whatsappService');
    console.log('✅ whatsappService found');
} catch (e) {
    console.log('❌ whatsappService NOT found:', e.message);
    if (e.code === 'MODULE_NOT_FOUND') {
        console.log('Require Stack:', e.stack);
    }
}
