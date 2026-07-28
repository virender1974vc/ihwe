const mongoose = require('mongoose');
const HotelStayPartner = require('../models/HotelStayPartner');
const hotelStayPartnerService = require('../services/hotelStayPartnerService');
require('dotenv').config();

async function run() {
  try {
    const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
    await mongoose.connect(uri);

    const existing = await HotelStayPartner.findOne();
    const plainHero = existing.hero.toObject();

    // Modify whyPartnerTitle and whyPartnerItems
    plainHero.whyPartnerTitle = "Why Partner Test " + Date.now();
    plainHero.whyPartnerItems = [
      { text: "Test Item 1", icon: "Users" },
      { text: "Test Item 2", icon: "Star" }
    ];

    console.log('Updating with:', plainHero.whyPartnerTitle);
    const updated = await hotelStayPartnerService.updateHotelStayPartner({
      hero: plainHero
    });

    console.log('Saved title in return:', updated.hero.whyPartnerTitle);
    console.log('Saved items in return:', JSON.stringify(updated.hero.whyPartnerItems));

    // Refetch from DB to confirm persistence
    const refetched = await HotelStayPartner.findOne();
    console.log('Refetched title from DB:', refetched.hero.whyPartnerTitle);
    console.log('Refetched items from DB:', JSON.stringify(refetched.hero.whyPartnerItems));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
run();
