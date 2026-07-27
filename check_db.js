const mongoose = require('mongoose');
const HotelStayPartner = require('./models/HotelStayPartner');
require('dotenv').config();

async function run() {
  try {
    const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
    await mongoose.connect(uri);
    const data = await HotelStayPartner.findOne();
    console.log('--- HOTEL STAY PARTNER DOCUMENT IN DB ---');
    console.log(JSON.stringify(data, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
run();
