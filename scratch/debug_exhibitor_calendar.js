const mongoose = require("mongoose");
require("dotenv").config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const BSMMeeting = mongoose.connection.collection("bsmmeetings");

    const allMeetings = await BSMMeeting.find({}).toArray();
    console.log(`Total meetings: ${allMeetings.length}\n`);

    // Group by exhibitor
    const grouped = {};
    for (const m of allMeetings) {
      const key = String(m.exhibitorId);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    }

    for (const [exId, meetings] of Object.entries(grouped)) {
      console.log(`\n🏢 Exhibitor: ${exId} (${meetings.length} meetings)`);
      for (const m of meetings) {
        const dateStr = m.date ? m.date.toISOString().split('T')[0] : 'NULL';
        console.log(`  [${m.status}] Date: ${dateStr} | Slot: ${m.timeSlot || 'none'} | Buyer: ${m.buyerId}`);
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err.message);
  }
};

run();
