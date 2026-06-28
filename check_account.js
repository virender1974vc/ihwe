require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const db = mongoose.connection.db;
    
    const doc = await db.collection('exhibitorregistrations').findOne({'contact1.mobile': '9310219283'});
    if (doc) {
        console.log("=== Registration Found ===");
        console.log("ID:", doc._id.toString());
        console.log("exhibitorName:", doc.exhibitorName);
        console.log("contact1.email:", doc.contact1?.email);
        console.log("contact1.mobile:", doc.contact1?.mobile);
        console.log("contact1.whatsapp:", doc.contact1?.whatsapp);
    } else {
        console.log("Not Found");
    }
    mongoose.disconnect();
}
run().catch(console.error);
