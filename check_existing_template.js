require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const db = mongoose.connection.db;
    
    // Check what fields existing templates have
    const existing = await db.collection('emailtemplates').findOne({});
    console.log("Sample template fields:", existing ? Object.keys(existing).join(', ') : 'No templates found');
    
    // Check if exhibitor-registration template exists as reference
    const regTemplate = await db.collection('emailtemplates').findOne({ formType: 'exhibitor-registration' });
    console.log("\nexhibitor-registration template:", regTemplate ? "Found" : "Not found");
    if (regTemplate) {
        console.log("Fields:", Object.keys(regTemplate).join(', '));
        console.log("headerImage:", regTemplate.headerImage);
        console.log("footerImage:", regTemplate.footerImage);
        console.log("smallLogo:", regTemplate.smallLogo);
    }
    
    mongoose.disconnect();
}
run().catch(console.error);
