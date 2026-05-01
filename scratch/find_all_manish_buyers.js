const mongoose = require("mongoose");
require("dotenv").config();

const findManishBuyers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const BuyerRegistration = mongoose.connection.collection("buyerregistrations");
    const buyers = await BuyerRegistration.find({ emailAddress: "manishsirohi023@gmail.com" }).toArray();
    console.log(`Found ${buyers.length} buyer registrations for Manish.`);
    
    for (const b of buyers) {
        console.log(`Buyer ${b._id}: FullName=${b.fullName}, Company=${b.companyName}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

findManishBuyers();
