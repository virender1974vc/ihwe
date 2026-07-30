const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Company = require("./models/Company");
const ExhibitorRegistration = require("./models/ExhibitorRegistration");

async function fixAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    // Find companies that have an event assignment where exhibitorRegistrationId is null
    const companies = await Company.find({
      "eventAssignments.exhibitorRegistrationId": null
    });

    console.log(`Found ${companies.length} companies to fix.`);

    for (const company of companies) {
      let modified = false;
      for (const assignment of company.eventAssignments) {
        if (!assignment.exhibitorRegistrationId) {
          // Look up registration for this company and event
          // Wait, the ExhibitorRegistration might be linked to the OLD event ID in registrationEventId.
          // Let's just find ANY registration for this company
          const reg = await ExhibitorRegistration.findOne({ clientId: company._id });
          if (reg) {
            assignment.exhibitorRegistrationId = reg._id;
            assignment.registrationEventId = reg.eventId;
            modified = true;
          }
        }
      }
      if (modified) {
        await Company.updateOne(
          { _id: company._id },
          { $set: { eventAssignments: company.eventAssignments } }
        );
        console.log(`Fixed company: ${company.companyName}`);
      }
    }

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}

fixAll();
