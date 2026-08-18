const Company = require("../models/Company");

// Estimates/PIs don't currently carry which CrmEvent they were raised under
// (the create-estimate UI doesn't pass one), so when no crmEventId is given
// we mark every event assignment the company has — the safe default since a
// company generally shouldn't be "Hot" for one event and not another once a
// commercial document has actually gone out.
const markCompanyHotLead = async (companyId, crmEventId = null) => {
  if (!companyId) return;
  try {
    // A company that already has a real stall booked (an ExhibitorRegistration
    // linked to this event with a stall on it) has moved past the lead stage.
    // Raising another PI for them later — extra stalls, a revised quote,
    // add-ons — must not silently downgrade them back to Hot Lead and drop
    // them out of the Booked/Converted lists (getHotLeadCompanies excludes
    // anyone with a booked stall, and getBookedCompanies only matches on this
    // exact status text, so a stray "Hot Lead" here makes them invisible in
    // every list). Only companies with no booked stall for this event get
    // (re-)marked Hot.
    const ExhibitorRegistration = require("../models/ExhibitorRegistration");
    const company = await Company.findById(companyId).select("eventAssignments").lean();
    if (!company) return;

    const scopedAssignment = crmEventId
      ? company.eventAssignments?.find((a) => String(a.eventId) === String(crmEventId))
      : null;
    const registrationIdsToCheck = scopedAssignment
      ? [scopedAssignment.exhibitorRegistrationId].filter(Boolean)
      : (company.eventAssignments || []).map((a) => a.exhibitorRegistrationId).filter(Boolean);

    if (registrationIdsToCheck.length) {
      const bookedRegistration = await ExhibitorRegistration.findOne({
        _id: { $in: registrationIdsToCheck },
        $or: [
          { "participation.stallNo": { $nin: [null, ""] } },
          { "participation.stallFor": { $nin: [null, ""] } },
        ],
      }).select("_id").lean();
      if (bookedRegistration) return;
    }

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
