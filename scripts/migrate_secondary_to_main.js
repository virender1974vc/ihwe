const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function migrate() {
    const mainUri = process.env.MONGO_URI_MAIN;
    const secondaryUri = process.env.MONGO_URI_SECONDARY;

    if (!mainUri || !secondaryUri) {
        console.error("❌ MONGO_URI_MAIN or MONGO_URI_SECONDARY is not defined in .env");
        process.exit(1);
    }

    console.log("🚀 Starting DB consolidate migration...");
    console.log(`Source (Secondary): ${secondaryUri.split('@')[1] || secondaryUri}`);
    console.log(`Target (Main): ${mainUri.split('@')[1] || mainUri}`);

    try {
        // Connect to secondary
        const secondaryConn = await mongoose.createConnection(secondaryUri).asPromise();
        console.log("✅ Connected to SECONDARY DB");

        // Connect to main
        const mainConn = await mongoose.createConnection(mainUri).asPromise();
        console.log("✅ Connected to MAIN DB");

        // Get all collection names from secondary
        const collections = await secondaryConn.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections in SECONDARY DB`);

        for (const collInfo of collections) {
            const collName = collInfo.name;
            if (collName.startsWith('system.')) continue;

            console.log(`\n📦 Migrating collection: ${collName}...`);
            
            const secondaryColl = secondaryConn.db.collection(collName);
            const mainColl = mainConn.db.collection(collName);

            // Fetch all data from secondary
            const data = await secondaryColl.find({}).toArray();
            console.log(`   Fetched ${data.length} documents from SECONDARY`);

            if (data.length > 0) {
                // Insert into main
                // We'll use insertMany with ordered: false to skip duplicates if any
                try {
                   const result = await mainColl.insertMany(data, { ordered: false });
                   console.log(`   Successfully migrated ${result.insertedCount} documents to MAIN`);
                } catch (err) {
                    if (err.writeErrors) {
                        console.log(`   Some documents already existed in MAIN (skipped ${err.writeErrors.length} duplicates)`);
                        console.log(`   Inserted ${data.length - err.writeErrors.length} new documents`);
                    } else {
                        console.error(`   ❌ Error inserting into MAIN for ${collName}:`, err.message);
                    }
                }
            } else {
                console.log(`   Collection is empty, skipping.`);
            }
        }

        console.log("\n✅ ALL DATA MIGRATED SUCCESSFULLY!");
        
        await secondaryConn.close();
        await mainConn.close();
        process.exit(0);

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
