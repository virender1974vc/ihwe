const mongoose = require("mongoose");
require("dotenv").config();

const findExhibitor = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const ExhibitorRegistration = mongoose.connection.collection("exhibitorregistrations");
    const exhibitor = await ExhibitorRegistration.findOne({ _id: new mongoose.Types.ObjectId("69f037a248ee4c4846c9a120") });
    console.log("Exhibitor:", JSON.stringify(exhibitor, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

findExhibitor();
