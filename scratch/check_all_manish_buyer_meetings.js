const mongoose = require("mongoose");
require("dotenv").config();

const checkAllManishMeetings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const BSMMeeting = mongoose.connection.collection("bsmmeetings");
    const regIds = [
        new mongoose.Types.ObjectId("69df53011379865f9cb2f17e"),
        new mongoose.Types.ObjectId("69e08e8e3369db40f5202c1d"),
        new mongoose.Types.ObjectId("69e9d6743be34614d419c85e")
    ];
    
    const meetings = await BSMMeeting.find({ buyerId: { $in: regIds } }).toArray();
    console.log(`Found ${meetings.length} meetings for Manish (across all Buyer IDs).`);
    
    for (const m of meetings) {
        console.log(`- Meeting ${m._id}: Exhibitor=${m.exhibitorId}, Status=${m.status}, Date=${m.date}, Slot=${m.timeSlot}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkAllManishMeetings();
