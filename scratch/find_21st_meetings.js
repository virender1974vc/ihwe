const mongoose = require("mongoose");
require("dotenv").config();

const findProblemMeetings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const BSMMeeting = mongoose.connection.collection("bsmmeetings");

    const targetDate = new Date("2026-08-21T00:00:00.000Z");

    const meetings = await BSMMeeting.find({
      date: { $gte: targetDate, $lt: new Date("2026-08-22T00:00:00.000Z") }
    }).toArray();

    console.log(`Found ${meetings.length} meetings on 21st Aug.`);

    for (const m of meetings) {
      console.log(`Meeting ${m._id}: Buyer=${m.buyerId}, Exhibitor=${m.exhibitorId}, Status=${m.status}, Slot=${m.timeSlot}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

findProblemMeetings();
