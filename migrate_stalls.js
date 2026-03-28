const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medical_expo";

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");
        
        const collection = mongoose.connection.collection('stalls');
        
        // List indexes
        const indexes = await collection.indexes();
        console.log("Current indexes:", JSON.stringify(indexes, null, 2));

        // Find and drop old unique index on stallNumber only
        const oldIndex = indexes.find(idx => idx.name === 'stallNumber_1' || (idx.key.stallNumber && Object.keys(idx.key).length === 1 && idx.unique));

        if (oldIndex) {
            console.log("Dropping index:", oldIndex.name);
            await collection.dropIndex(oldIndex.name);
            console.log("Old index dropped successfully!");
        } else {
            console.log("No old unique index on 'stallNumber' found.");
        }

        // Drop index on stallType if it exists
        const oldTypeIndex = indexes.find(idx => idx.name === 'stallType_1' || idx.key.stallType);
        if (oldTypeIndex) {
            console.log("Dropping old stallType index:", oldTypeIndex.name);
            await collection.dropIndex(oldTypeIndex.name);
        }

        // Create compound index for eventId and stallNumber
        console.log("Creating compound index { eventId: 1, stallNumber: 1 }...");
        await collection.createIndex({ eventId: 1, stallNumber: 1 }, { unique: true });
        console.log("Compound index created successfully!");

        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}

migrate();
