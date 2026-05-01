const mongoose = require("mongoose");
require("dotenv").config();

const findManishExhibitors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    const ExhibitorRegistration = mongoose.connection.collection("exhibitorregistrations");
    const exhibitors = await ExhibitorRegistration.find({ 
        $or: [
            { "contact1.email": "manishsirohi023@gmail.com" },
            { "contact1.mobile": "9568259784" }
        ]
    }).toArray();
    console.log(`Found ${exhibitors.length} exhibitor registrations for Manish.`);
    
    for (const e of exhibitors) {
        console.log(`Exhibitor ${e._id}: Name=${e.exhibitorName}, Status=${e.status}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

findManishExhibitors();
