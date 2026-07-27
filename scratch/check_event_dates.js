const mongoose = require("mongoose");
require("dotenv").config();

const checkEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const Event = mongoose.connection.collection("events");
    const event = await Event.findOne({ status: "active" });
    console.log("Active Event:", JSON.stringify(event, null, 2));

    const BSMMeeting = mongoose.connection.collection("bsmmeetings");
    const sampleMeeting = await BSMMeeting.findOne({ date: { $ne: null } });
    console.log("Sample Meeting Date:", sampleMeeting ? sampleMeeting.date : "None");

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkEvents();
