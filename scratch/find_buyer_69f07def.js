const mongoose = require("mongoose");
require("dotenv").config();

const findBuyerById = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const BuyerRegistration = mongoose.connection.collection("buyerregistrations");
    const buyer = await BuyerRegistration.findOne({ _id: new mongoose.Types.ObjectId("69f07def11c91cd3cf6448af") });
    console.log("Buyer:", JSON.stringify(buyer, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

findBuyerById();
