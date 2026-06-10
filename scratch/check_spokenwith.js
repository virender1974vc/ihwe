const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/exhibitor_seller/ExhibitorRegistration');
require('dotenv').config();

async function run() {
  try {
    const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ihwe";
    await mongoose.connect(uri);
    
    console.log('--- CONNECTED TO DATABASE ---');
    
    // Distinct spokenWith values
    const distinctSpokenWith = await ExhibitorRegistration.distinct('spokenWith');
    console.log('Distinct spokenWith values:', distinctSpokenWith);
    
    // Check for Vansh or vansh
    const exhibitors = await ExhibitorRegistration.find({
      spokenWith: { $regex: /vansh/i }
    }).select('exhibitorName spokenWith registrationId').limit(10);
    
    console.log('Exhibitors matching "vansh" (case-insensitive):');
    console.log(JSON.stringify(exhibitors, null, 2));

    const totalMatching = await ExhibitorRegistration.countDocuments({
      spokenWith: { $regex: /vansh/i }
    });
    console.log('Total exhibitors matching "vansh":', totalMatching);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
run();
