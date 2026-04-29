const mongoose = require("mongoose");
require("dotenv").config();

const checkBuyerMeetings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const BSMMeeting = mongoose.connection.collection("bsmmeetings");
    const buyerId = new mongoose.Types.ObjectId("69f07def11c91cd3cf6448af");
    
    const meetings = await BSMMeeting.find({ buyerId }).toArray();
    console.log(`Found ${meetings.length} meetings for buyer.`);
    
    meetings.forEach(m => {
        console.log(`- Meeting ${m._id}: Date=${m.date}, Slot=${m.timeSlot}, Status=${m.status}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkBuyerMeetings();
