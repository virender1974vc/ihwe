const mongoose = require('mongoose');
const HotelStayPartner = require('../models/HotelStayPartner');
require('dotenv').config();

async function run() {
  try {
    const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
    await mongoose.connect(uri);
    const count = await HotelStayPartner.countDocuments();
    console.log('Total HotelStayPartner documents:', count);
    const docs = await HotelStayPartner.find();
    docs.forEach((doc, idx) => {
      console.log(`Doc ${idx}: _id = ${doc._id}, whyPartnerTitle = ${doc.hero?.whyPartnerTitle}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
run();
