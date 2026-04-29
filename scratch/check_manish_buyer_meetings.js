const mongoose = require("mongoose");
require("dotenv").config();

const checkManishMeetings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const BSMMeeting = mongoose.connection.collection("bsmmeetings");
    const buyerId = new mongoose.Types.ObjectId("69df53011379865f9cb2f17e");
    
    const meetings = await BSMMeeting.find({ buyerId }).toArray();
    console.log(`Found ${meetings.length} meetings for Manish (Buyer).`);
    
    for (const m of meetings) {
        console.log(`- Meeting ${m._id}: Exhibitor=${m.exhibitorId}, Status=${m.status}, Date=${m.date}, Slot=${m.timeSlot}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkManishMeetings();
