require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const db = mongoose.connection.db;
    
    const template = await db.collection('emailtemplates').findOne({ formType: 'exhibitor-accessory-order' });
    console.log("Template found:", template ? "YES" : "NO");
    if (template) {
        console.log("emailBody exists:", !!template.emailBody);
        console.log("emailSubject:", template.emailSubject);
        console.log("whatsappBody exists:", !!template.whatsappBody);
    }
    
    mongoose.disconnect();
}
run().catch(console.error);
