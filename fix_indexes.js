const mongoose = require("mongoose");
require("dotenv").config();

const dropIndex = async () => {
  try {
    const uri = process.env.MONGO_URI_MAIN || "mongodb://localhost:27017/medical_expo"; // Adjust DB name if needed
    await mongoose.connect(uri);
    console.log("Connected to MongoDB...");

    const collection = mongoose.connection.collection("bsmmeetings");
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes.map(i => i.name));

    // Drop the problematic index
    const indexName = "buyerId_1_date_1_timeSlot_1";
    const exists = indexes.find(i => i.name === indexName);

    if (exists) {
      await collection.dropIndex(indexName);
      console.log(`Successfully dropped index: ${indexName}`);
    } else {
      console.log(`Index ${indexName} not found.`);
    }

    // Also check for exhibitor equivalent
    const exhIndex = "exhibitorId_1_date_1_timeSlot_1";
    if (indexes.find(i => i.name === exhIndex)) {
      await collection.dropIndex(exhIndex);
      console.log(`Successfully dropped index: ${exhIndex}`);
    }

    await mongoose.disconnect();
    console.log("Disconnected.");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

dropIndex();
