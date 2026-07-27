const mongoose = require('mongoose');
const { secondaryDB } = require('./config/secondaryDb');
const NatureOfBusiness = require('./models/NatureOfBusiness');

async function test() {
    console.log("Connecting to DB...");
    const record = await NatureOfBusiness.findOne();
    if (record) {
        console.log("Found record before update:", record);
        record.short_code = "TEST";
        record.description = "Test Desc";
        await record.save();
        const updated = await NatureOfBusiness.findById(record._id);
        console.log("Record after update:", updated);
    } else {
        console.log("No records found.");
    }
    process.exit(0);
}

test();
