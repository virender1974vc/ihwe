require("dotenv").config();
const mongoose = require("mongoose");
const ExhibitionRole = require("./models/add_by_admin/ExhibitionRole");

const DEFAULT_ROLES = [
  "Primary Contact",
  "Stall Incharge",
  "Sales Team",
  "Marketing Team",
  "Product Demonstrator",
  "Technical Support",
  "Reception / Hospitality",
  "Registration Coordinator",
  "Logistics Coordinator",
  "Operations Coordinator",
  "Business Development",
  "Management / Owner",
];

const seedExhibitionRoles = async () => {
  try {
    const mongoUri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ihwe";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding exhibition roles");

    for (const name of DEFAULT_ROLES) {
      await ExhibitionRole.findOneAndUpdate(
        { name },
        { $setOnInsert: { name, status: "active", updated_by: "Seed" } },
        { upsert: true, returnDocument: 'after' },
      );
    }

    console.log(`Seeded ${DEFAULT_ROLES.length} exhibition roles`);
  } catch (error) {
    console.error("Error seeding exhibition roles:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedExhibitionRoles();
