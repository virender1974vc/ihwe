const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Company = require("./models/Company");

async function fixSelectkaro() {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    const companyId = "6a687f68200fe4b74fa4553a";
    const eventId = "68ff46097debd52c00738036";
    const regId = "6a687f68200fe4b74fa45535";
    const regEventId = "69edb20efdd846637abaaee0";

    const res = await Company.updateOne(
      { _id: companyId, "eventAssignments.eventId": eventId },
      {
        $set: {
          "eventAssignments.$.exhibitorRegistrationId": regId,
          "eventAssignments.$.registrationEventId": regEventId,
        }
      }
    );

    console.log("Update Result:", res);
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}

fixSelectkaro();
