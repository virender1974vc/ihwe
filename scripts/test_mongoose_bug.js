const mongoose = require('mongoose');
const HotelStayPartner = require('./models/HotelStayPartner');
require('dotenv').config();

async function run() {
  try {
    const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
    console.log('Connecting to', uri);
    await mongoose.connect(uri);
    console.log('Connected');

    // 1. Clean up and insert test document
    await HotelStayPartner.deleteMany({});
    
    let doc = new HotelStayPartner({
      hero: {
        title: "INITIAL CUSTOM TITLE",
        subtitle: "INITIAL SUBTITLE",
        image: "initial-image.jpg"
      }
    });
    await doc.save();
    console.log('Saved initial doc with title:', doc.hero.title);

    // 2. Load and emulate PUT update (like updating text content)
    let doc2 = await HotelStayPartner.findOne();
    doc2.hero.title = "UPDATED CUSTOM TITLE";
    doc2.markModified('hero');
    await doc2.save();
    console.log('Updated title in DB:', doc2.hero.title);

    // 3. Load and emulate image upload (updateHeroImage)
    let doc3 = await HotelStayPartner.findOne();
    console.log('Loaded doc3 before image update. Title is:', doc3.hero.title);
    if (!doc3.hero) doc3.hero = {};
    doc3.hero.image = "new-uploaded-image.jpg";
    doc3.markModified('hero');
    await doc3.save();
    
    // 4. Load final document to check
    let finalDoc = await HotelStayPartner.findOne();
    console.log('Final DB Document:');
    console.log('hero.title:', JSON.stringify(finalDoc.hero.title));
    console.log('hero.image:', JSON.stringify(finalDoc.hero.image));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
