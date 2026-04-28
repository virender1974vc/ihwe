const mongoose = require("mongoose");
require("dotenv").config();

const findBuyer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const BuyerRegistration = mongoose.connection.collection("buyerregistrations");
    // Search for "Manish"
    const buyer = await BuyerRegistration.findOne({ fullName: /Manish/i });
    console.log("Buyer:", JSON.stringify(buyer, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

findBuyer();
