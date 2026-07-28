const mongoose = require("mongoose");
const StatusOption = require("../models/add_by_admin/StatusOption");
const NatureOfBusiness = require("../models/NatureOfBusiness");
const CrmExhibitorCategory = require("../models/CrmExhibitorCategory");
const NextAction = require("../models/add_by_admin/NextAction");
const CrmEvent = require("../models/CrmEvent");
const PrimaryProductInterest = require("../models/add_by_admin/PrimaryProductInterest");
const SecondaryProduct = require("../models/add_by_admin/SecondaryProduct");
const MeetingPriorityLevel = require("../models/add_by_admin/MeetingPriorityLevel");
const Unit = require("../models/add_by_admin/Unit");
const AnnualTurnover = require("../models/add_by_admin/AnnualTurnover");
const BusinessType = require("../models/add_by_admin/BusinessType");
const PreviousExhibition = require("../models/PreviousExhibition");

exports.seedMasterData = async (req, res) => {
  try {
    let results = {};

    // 1. StatusOption
    const statusCount = await StatusOption.countDocuments();
    if (statusCount === 0) {
      await StatusOption.insertMany([
        { name: "New Lead", status: "active", status_code: "NEW", display_order: 1 },
        { name: "Contacted", status: "active", status_code: "CONTACTED", display_order: 2 },
        { name: "Proposal Sent", status: "active", status_code: "PROPOSAL", display_order: 3 },
        { name: "Converted", status: "active", status_code: "WON", display_order: 4 },
        { name: "Lost Lead", status: "active", status_code: "LOST", display_order: 5 }
      ]);
      results.statusOptions = "Seeded 5 statuses";
    } else {
      results.statusOptions = "Already seeded";
    }

    // 2. NatureOfBusiness
    const natureCount = await NatureOfBusiness.countDocuments();
    if (natureCount === 0) {
      await NatureOfBusiness.insertMany([
        { nature_id: 1, nature_name: "Manufacturer", short_code: "MFG", display_order: 1, nature_status: "active" },
        { nature_id: 2, nature_name: "Distributor/Wholesaler", short_code: "DIST", display_order: 2, nature_status: "active" },
        { nature_id: 3, nature_name: "Retailer", short_code: "RET", display_order: 3, nature_status: "active" },
        { nature_id: 4, nature_name: "Service Provider", short_code: "SVC", display_order: 4, nature_status: "active" }
      ]);
      results.natureOfBusiness = "Seeded 4 natures";
    } else {
      results.natureOfBusiness = "Already seeded";
    }

    // 3. CrmExhibitorCategory
    const catCount = await CrmExhibitorCategory.countDocuments();
    if (catCount === 0) {
      await CrmExhibitorCategory.insertMany([
        { cat_id: 1, cat_name: "Organic Foods", cat_status: "active", display_order: 1 },
        { cat_id: 2, cat_name: "Healthcare", cat_status: "active", display_order: 2 },
        { cat_id: 3, cat_name: "Wellness", cat_status: "active", display_order: 3 },
        { cat_id: 4, cat_name: "Technology", cat_status: "active", display_order: 4 }
      ]);
      results.categories = "Seeded 4 categories";
    } else {
      results.categories = "Already seeded";
    }

    // 4. NextAction
    const actionCount = await NextAction.countDocuments();
    if (actionCount === 0) {
      await NextAction.insertMany([
        { name: "Call Back", action_code: "CALL", action_type: "communication", display_order: 1 },
        { name: "Send Email", action_code: "EMAIL", action_type: "communication", display_order: 2 },
        { name: "Schedule Meeting", action_code: "MEET", action_type: "event", display_order: 3 },
        { name: "Share Proposal", action_code: "PROPOSAL", action_type: "task", display_order: 4 }
      ]);
      results.nextActions = "Seeded 4 actions";
    } else {
      results.nextActions = "Already seeded";
    }

    // 5. CrmEvent
    const eventCount = await CrmEvent.countDocuments();
    if (eventCount === 0) {
      await CrmEvent.insertMany([
        { event_name: "IHWE 2026", event_fullName: "9th International Health & Wellness Expo 2026", event_fromDate: new Date("2026-05-15"), event_toDate: new Date("2026-05-17"), event_address: "Pragati Maidan", event_country: "India", event_state: "Delhi", event_city: "New Delhi", event_pincode: "110001", event_status: "Active", added_by: "System" },
        { event_name: "Organic Expo 2026", event_fullName: "Organic & Natural Expo 2026", event_fromDate: new Date("2026-08-10"), event_toDate: new Date("2026-08-12"), event_address: "India Expo Centre", event_country: "India", event_state: "Uttar Pradesh", event_city: "Greater Noida", event_pincode: "201306", event_status: "Active", added_by: "System" }
      ]);
      results.events = "Seeded 2 events";
    } else {
      results.events = "Already seeded";
    }

    // 6. PrimaryProductInterest
    const primaryCount = await PrimaryProductInterest.countDocuments();
    if (primaryCount === 0) {
      await PrimaryProductInterest.insertMany([
        { primary_product_interest: "Ayurvedic Products", status: "Active", added_by: "System" },
        { primary_product_interest: "Organic Supplements", status: "Active", added_by: "System" },
        { primary_product_interest: "Medical Devices", status: "Active", added_by: "System" }
      ]);
      results.primaryProducts = "Seeded 3 primary products";
    } else {
      results.primaryProducts = "Already seeded";
    }

    // 7. SecondaryProduct
    const secondaryCount = await SecondaryProduct.countDocuments();
    if (secondaryCount === 0) {
      await SecondaryProduct.insertMany([
        { secondary_product_categories: "Herbal Teas", status: "Active", added_by: "System" },
        { secondary_product_categories: "Vitamins", status: "Active", added_by: "System" },
        { secondary_product_categories: "Fitness Equipment", status: "Active", added_by: "System" }
      ]);
      results.secondaryProducts = "Seeded 3 secondary products";
    } else {
      results.secondaryProducts = "Already seeded";
    }

    // 8. MeetingPriorityLevel
    const priorityCount = await MeetingPriorityLevel.countDocuments();
    if (priorityCount === 0) {
      await MeetingPriorityLevel.insertMany([
        { meeting_priority_level: "High", status: "Active", added_by: "System" },
        { meeting_priority_level: "Medium", status: "Active", added_by: "System" },
        { meeting_priority_level: "Low", status: "Active", added_by: "System" }
      ]);
      results.priorities = "Seeded 3 priorities";
    } else {
      results.priorities = "Already seeded";
    }

    // 9. Unit
    const unitCount = await Unit.countDocuments();
    if (unitCount === 0) {
      await Unit.insertMany([
        { unit: "Pieces (Pcs)", status: "Active", added_by: "System" },
        { unit: "Kilograms (Kg)", status: "Active", added_by: "System" },
        { unit: "Liters (L)", status: "Active", added_by: "System" },
        { unit: "Boxes", status: "Active", added_by: "System" }
      ]);
      results.units = "Seeded 4 units";
    } else {
      results.units = "Already seeded";
    }

    // 10. AnnualTurnover
    const turnoverCount = await AnnualTurnover.countDocuments();
    if (turnoverCount === 0) {
      await AnnualTurnover.insertMany([
        { annual_turnover: "0 - 50 Lakhs", status: "Active", added_by: "System" },
        { annual_turnover: "50 Lakhs - 1 Crore", status: "Active", added_by: "System" },
        { annual_turnover: "1 Crore - 5 Crores", status: "Active", added_by: "System" },
        { annual_turnover: "5 Crores +", status: "Active", added_by: "System" }
      ]);
      results.turnovers = "Seeded 4 turnovers";
    } else {
      results.turnovers = "Already seeded";
    }

    // 11. BusinessType
    const bTypeCount = await BusinessType.countDocuments();
    if (bTypeCount === 0) {
      await BusinessType.insertMany([
        { business_type: "B2B (Business to Business)", status: "Active", added_by: "System" },
        { business_type: "B2C (Business to Consumer)", status: "Active", added_by: "System" },
        { business_type: "D2C (Direct to Consumer)", status: "Active", added_by: "System" },
        { business_type: "B2G (Business to Government)", status: "Active", added_by: "System" }
      ]);
      results.businessTypes = "Seeded 4 business types";
    } else {
      results.businessTypes = "Already seeded";
    }

    // 12. PreviousExhibition
    const prevExhibCount = await PreviousExhibition.countDocuments();
    if (prevExhibCount === 0) {
      const defaultUser = { userId: "system", username: "System", fullName: "System Admin" };
      await PreviousExhibition.insertMany([
        { name: "IHWE 2024", status: "Active", createdBy: defaultUser, updatedBy: defaultUser },
        { name: "IHWE 2025", status: "Active", createdBy: defaultUser, updatedBy: defaultUser },
        { name: "Organic Expo 2025", status: "Active", createdBy: defaultUser, updatedBy: defaultUser }
      ]);
      results.previousExhibitions = "Seeded 3 previous exhibitions";
    } else {
      results.previousExhibitions = "Already seeded";
    }

    return res.status(200).json({
      success: true,
      message: "Master data seeding completed successfully",
      data: results
    });

  } catch (error) {
    console.error("Error seeding master data:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while seeding master data",
      error: error.message
    });
  }
};
