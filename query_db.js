require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const db = mongoose.connection.db;
    
    // Find exhibitor by mobile
    let doc = await db.collection('exhibitorregistrations').findOne({'contact1.mobile': '9310219283'});
    console.log("By 9310219283:", doc ? "Found" : "Not Found");
    if (doc) console.log(JSON.stringify({id: doc._id, email: doc.contact1?.email, mobile: doc.contact1?.mobile, whatsapp: doc.contact1?.whatsapp}, null, 2));

    let doc2 = await db.collection('exhibitorregistrations').findOne({'contact1.mobile': '9876543211'});
    console.log("By 9876543211:", doc2 ? "Found" : "Not Found");
    if (doc2) console.log(JSON.stringify({id: doc2._id, email: doc2.contact1?.email, mobile: doc2.contact1?.mobile, whatsapp: doc2.contact1?.whatsapp}, null, 2));

    let doc3 = await db.collection('exhibitorregistrations').findOne({'contact1.email': 'chaudharyaman1920@gmail.com'});
    console.log("By email:", doc3 ? "Found" : "Not Found");
    if (doc3) console.log(JSON.stringify({id: doc3._id, email: doc3.contact1?.email, mobile: doc3.contact1?.mobile, whatsapp: doc3.contact1?.whatsapp}, null, 2));

    mongoose.disconnect();
}
run().catch(console.error);
