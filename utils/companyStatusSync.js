const Company = require("../models/Company");

// Estimates/PIs don't currently carry which CrmEvent they were raised under
// (the create-estimate UI doesn't pass one), so when no crmEventId is given
// we mark every event assignment the company has — the safe default since a
// company generally shouldn't be "Hot" for one event and not another once a
// commercial document has actually gone out.
const markCompanyHotLead = async (companyId, crmEventId = null) => {
  if (!companyId) return;
  try {
    if (crmEventId) {
      const updated = await Company.findOneAndUpdate(
        { _id: companyId, "eventAssignments.eventId": crmEventId },
        {
          $set: {
            companyStatus: "Hot Lead",
            "eventAssignments.$.status": "Hot Lead",
            "eventAssignments.$.updatedAt": new Date(),
          },
        },
      );
      if (updated) return;
    }

    await Company.findByIdAndUpdate(companyId, {
      $set: {
        companyStatus: "Hot Lead",
        "eventAssignments.$[].status": "Hot Lead",
        "eventAssignments.$[].updatedAt": new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to mark company as Hot Lead:", error.message);
  }
};

module.exports = { markCompanyHotLead };
