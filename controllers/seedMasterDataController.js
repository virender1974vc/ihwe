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

    const seedCollection = async (Model, dataArray, name) => {
      const count = await Model.countDocuments();
      if (count === 0 && dataArray.length > 0) {
        await Model.insertMany(dataArray);
        results[name] = "Seeded " + dataArray.length + " records";
      } else {
        results[name] = "Already seeded or no data to seed";
      }
    };

    const datasets = {
  "StatusOption": [
    {
      "name": "Completed",
      "status": "active",
      "user": 1,
      "updated_by": "Vansh Chaudhary",
      "applicable_for": [
        "All"
      ],
      "color": "#2563eb",
      "display_order": 8,
      "description": "Full payment received and process completed",
      "status_code": ""
    },
    {
      "name": "Contacted",
      "status": "active",
      "user": 1,
      "updated_by": "Vansh Chaudhary",
      "applicable_for": [
        "All"
      ],
      "color": "#2563eb",
      "display_order": 2,
      "description": "First call or email done",
      "status_code": ""
    },
    {
      "name": "Booking Confirmed",
      "status": "active",
      "user": 1,
      "updated_by": "Vansh Chaudhary",
      "applicable_for": [
        "All"
      ],
      "color": "#2563eb",
      "display_order": 6,
      "description": "Advance received and stall booked",
      "status_code": ""
    },
    {
      "name": "New Lead",
      "status": "active",
      "user": 1,
      "updated_by": "Vansh Chaudhary",
      "applicable_for": [
        "All"
      ],
      "color": "#2563eb",
      "display_order": 1,
      "description": "New enquiry received",
      "status_code": ""
    },
    {
      "name": "Follow-up",
      "status": "active",
      "user": 1,
      "updated_by": "Vansh Chaudhary",
      "applicable_for": [
        "All"
      ],
      "color": "#2563eb",
      "display_order": 3,
      "description": "Follow-up scheduled",
      "status_code": ""
    },
    {
      "name": "Negotiation",
      "status": "active",
      "user": 1,
      "updated_by": "Vansh Chaudhary",
      "applicable_for": [
        "All"
      ],
      "color": "#2563eb",
      "display_order": 5,
      "description": "Price or terms under discussion",
      "status_code": ""
    },
    {
      "name": "Payment Pending",
      "status": "active",
      "user": 1,
      "updated_by": "Vansh Chaudhary",
      "applicable_for": [
        "All"
      ],
      "color": "#2563eb",
      "display_order": 7,
      "description": "Booking confirmed, balance payment pending",
      "status_code": ""
    },
    {
      "name": "Not Interested",
      "status": "active",
      "user": 1,
      "updated_by": "Vansh Chaudhary",
      "applicable_for": [
        "All"
      ],
      "color": "#2563eb",
      "display_order": 10,
      "description": "Lead closed - client is not interested",
      "status_code": ""
    },
    {
      "name": "Proposal Sent",
      "status": "active",
      "user": 1,
      "updated_by": "Vansh Chaudhary",
      "applicable_for": [
        "All"
      ],
      "color": "#2563eb",
      "display_order": 4,
      "description": "Quotation / Proposal shared",
      "status_code": ""
    },
    {
      "name": "On Hold",
      "status": "active",
      "user": 1,
      "updated_by": "Vansh Chaudhary",
      "applicable_for": [
        "All"
      ],
      "color": "#2563eb",
      "display_order": 9,
      "description": "Client requested to wait",
      "status_code": ""
    }
  ],
  "NatureOfBusiness": [
    {
      "nature_id": 1,
      "nature_name": "Manufacturer",
      "nature_description": "Entity involved in manufacturing of products.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 2,
      "nature_name": "Importer",
      "nature_description": "Entity importing products from other countries.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 3,
      "nature_name": "Exporter",
      "nature_description": "Entity exporting products to other countries.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 4,
      "nature_name": "Distributor",
      "nature_description": "Entity distributing products to dealers/retailers.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 5,
      "nature_name": "Dealer",
      "nature_description": "Entity dealing in sale of products to end users.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 6,
      "nature_name": "Retailer",
      "nature_description": "Entity selling products directly to end customers.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 7,
      "nature_name": "Service Provider",
      "nature_description": "Entity providing services to customers.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 8,
      "nature_name": "Startup",
      "nature_description": "Newly established innovative business.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 9,
      "nature_name": "NGO / Trust",
      "nature_description": "Non-profit organization / trust.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 10,
      "nature_name": "Government",
      "nature_description": "Government department / public entity.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 11,
      "nature_name": "Institution",
      "nature_description": "Educational or research institution.",
      "nature_status": "Active",
      "updated_by": "Vijay Sharma (Admin)"
    },
    {
      "nature_id": 12,
      "nature_name": "Others",
      "nature_description": "Any other type of business nature.",
      "nature_status": "Inactive",
      "updated_by": "Vijay Sharma (Admin)"
    }
  ],
  "CrmExhibitorCategory": [
    {
      "cat_id": 11,
      "cat_name": "Hospitals & Healthcare Institutions",
      "cat_status": "Active",
      "applicable_for": [
        "Exhibitor Lead",
        "Exhibitor Registration",
        "Buyer Lead",
        "Sponsor Lead",
        "Visitor Lead"
      ],
      "display_order": 7,
      "business_nature": "Institution",
      "icon_data_url": "",
      "icon_name": "",
      "parent_category": "Healthcare",
      "updated_by": "Vansh Chaudhary"
    },
    {
      "cat_id": 12,
      "cat_name": "Medical Equipment Manufacturers",
      "cat_status": "Active",
      "updated_by": "Vansh Chaudhary",
      "parent_category": "Medical Devices",
      "business_nature": "Manufacturer",
      "display_order": 8,
      "applicable_for": [
        "Exhibitor Lead",
        "Exhibitor Registration"
      ],
      "icon_name": "",
      "icon_data_url": ""
    },
    {
      "cat_id": 13,
      "cat_name": "Pharmaceutical Companies",
      "cat_status": "Active",
      "updated_by": "Vansh Chaudhary",
      "parent_category": "Pharma & Biotechnology",
      "business_nature": "Manufacturer",
      "display_order": 9,
      "applicable_for": [
        "Exhibitor Lead",
        "Exhibitor Registration"
      ],
      "icon_name": "",
      "icon_data_url": ""
    },
    {
      "cat_id": 14,
      "cat_name": "Ayurveda & Herbal Products",
      "cat_status": "Active",
      "updated_by": "Vansh Chaudhary",
      "parent_category": "AYUSH",
      "business_nature": "Manufacturer",
      "display_order": 10,
      "applicable_for": [
        "Exhibitor Lead",
        "Exhibitor Registration"
      ],
      "icon_name": "",
      "icon_data_url": ""
    },
    {
      "cat_id": 15,
      "cat_name": "Wellness & Fitness Centers",
      "cat_status": "Active",
      "updated_by": "Vansh Chaudhary",
      "parent_category": "Wellness & Fitness",
      "business_nature": "Service Provider",
      "display_order": 11,
      "applicable_for": [
        "Exhibitor Lead",
        "Exhibitor Registration"
      ],
      "icon_name": "",
      "icon_data_url": ""
    },
    {
      "cat_id": 16,
      "cat_name": "Organic Food Products",
      "cat_status": "Active",
      "updated_by": "Vansh Chaudhary",
      "parent_category": "Organic & Natural",
      "business_nature": "Manufacturer",
      "display_order": 12,
      "applicable_for": [
        "Exhibitor Lead",
        "Exhibitor Registration"
      ],
      "icon_name": "",
      "icon_data_url": ""
    },
    {
      "cat_id": 17,
      "cat_name": "Cosmetics & Personal Care",
      "cat_status": "Active",
      "updated_by": "Vansh Chaudhary",
      "parent_category": "Beauty & Personal Care",
      "business_nature": "Manufacturer",
      "display_order": 13,
      "applicable_for": [
        "Exhibitor Lead",
        "Exhibitor Registration"
      ],
      "icon_name": "",
      "icon_data_url": ""
    },
    {
      "cat_id": 18,
      "cat_name": "Healthcare Software",
      "cat_status": "Active",
      "updated_by": "Vansh Chaudhary",
      "parent_category": "Digital Health",
      "business_nature": "Service Provider",
      "display_order": 14,
      "applicable_for": [
        "Exhibitor Lead",
        "Exhibitor Registration"
      ],
      "icon_name": "",
      "icon_data_url": ""
    },
    {
      "cat_id": 19,
      "cat_name": "Medical Tourism",
      "cat_status": "Active",
      "updated_by": "Vansh Chaudhary",
      "parent_category": "Medical Tourism",
      "business_nature": "Service Provider",
      "display_order": 15,
      "applicable_for": [
        "Exhibitor Lead",
        "Exhibitor Registration"
      ],
      "icon_name": "",
      "icon_data_url": ""
    },
    {
      "cat_id": 20,
      "cat_name": "Packaging Solutions",
      "cat_status": "Active",
      "updated_by": "Vansh Chaudhary",
      "parent_category": "Packaging & Manufacturing",
      "business_nature": "Manufacturer",
      "display_order": 16,
      "applicable_for": [
        "Exhibitor Lead",
        "Exhibitor Registration"
      ],
      "icon_name": "",
      "icon_data_url": ""
    }
  ],
  "NextAction": [
    {
      "name": "Call",
      "action_code": "CALL",
      "description": "Call the lead for follow-up.",
      "display_order": 1,
      "action_type": "Call",
      "follow_up_days": 1,
      "status": "active",
      "applicable_for": [
        "Exhibitor Lead",
        "Buyer Lead",
        "Sponsor Lead",
        "Visitor Lead"
      ],
      "updated_by": "Vansh Chaudhary"
    },
    {
      "name": "Email Needed",
      "action_code": "EMAIL",
      "description": "Send an email to the lead.",
      "display_order": 2,
      "action_type": "Email",
      "follow_up_days": 2,
      "status": "active",
      "applicable_for": [
        "Exhibitor Lead",
        "Buyer Lead",
        "Sponsor Lead",
        "Visitor Lead"
      ],
      "updated_by": "Vansh Chaudhary"
    },
    {
      "name": "Send Proposal",
      "action_code": "PROPOSAL",
      "description": "Send a proposal to the lead.",
      "display_order": 3,
      "action_type": "Proposal",
      "follow_up_days": 3,
      "status": "active",
      "applicable_for": [
        "Exhibitor Lead",
        "Buyer Lead",
        "Sponsor Lead",
        "Visitor Lead"
      ],
      "updated_by": "Vansh Chaudhary"
    },
    {
      "name": "Meeting",
      "action_code": "MEET",
      "description": "Schedule or conduct a meeting.",
      "display_order": 4,
      "action_type": "Meeting",
      "follow_up_days": 1,
      "status": "active",
      "applicable_for": [
        "Exhibitor Lead",
        "Buyer Lead",
        "Sponsor Lead",
        "Visitor Lead"
      ],
      "updated_by": "Vansh Chaudhary"
    },
    {
      "name": "Follow Up",
      "action_code": "FOLLOWUP",
      "description": "Follow up with the lead.",
      "display_order": 5,
      "action_type": "Follow Up",
      "follow_up_days": 2,
      "status": "active",
      "applicable_for": [
        "Exhibitor Lead",
        "Buyer Lead",
        "Sponsor Lead",
        "Visitor Lead"
      ],
      "updated_by": "Vansh Chaudhary"
    },
    {
      "name": "Site Visit",
      "action_code": "SITEVISIT",
      "description": "Plan or schedule a site visit.",
      "display_order": 6,
      "action_type": "Visit",
      "follow_up_days": 4,
      "status": "active",
      "applicable_for": [
        "Exhibitor Lead",
        "Buyer Lead",
        "Sponsor Lead",
        "Visitor Lead"
      ],
      "updated_by": "Vansh Chaudhary"
    },
    {
      "name": "Send Quotation",
      "action_code": "QUOTATION",
      "description": "Send a quotation to the lead.",
      "display_order": 7,
      "action_type": "Quotation",
      "follow_up_days": 2,
      "status": "active",
      "applicable_for": [
        "Exhibitor Lead",
        "Buyer Lead",
        "Sponsor Lead",
        "Visitor Lead"
      ],
      "updated_by": "Vansh Chaudhary"
    },
    {
      "name": "Document Sharing",
      "action_code": "DOCSHARE",
      "description": "Share required documents with the lead.",
      "display_order": 8,
      "action_type": "Document",
      "follow_up_days": 2,
      "status": "inactive",
      "applicable_for": [
        "Exhibitor Lead",
        "Buyer Lead",
        "Sponsor Lead",
        "Visitor Lead"
      ],
      "updated_by": "Vansh Chaudhary"
    }
  ],
  "CrmEvent": [
    {
      "event_name": "IHWE Expo 2026",
      "event_fullName": "IHWE Expo 2026",
      "event_fromDate": "2026-08-21T00:00:00.000Z",
      "event_toDate": "2026-08-23T00:00:00.000Z",
      "event_address": "Hall No. 12, Pragati Maidain",
      "event_country": "India",
      "event_state": "Delhi",
      "event_city": "New Delhi",
      "event_pincode": "560002",
      "event_handleBy": "Rohit Kumar",
      "event_status": "active",
      "added_by": "System",
      "updated_by": "Rohit Kumar"
    },
    {
      "event_name": "Organic Expo 2027",
      "event_fullName": "Organic Expo 2027",
      "event_fromDate": "2027-03-17T00:00:00.000Z",
      "event_toDate": "2027-03-20T00:00:00.000Z",
      "event_address": "Hall No. 12, Pragati Maidain",
      "event_country": "India",
      "event_state": "Delhi",
      "event_city": "New Delhi",
      "event_pincode": "121015",
      "event_status": "active",
      "added_by": "System"
    },
    {
      "event_name": "Organic Expo",
      "event_fullName": "Organic Expo 2026",
      "event_fromDate": "2026-03-20T00:00:00.000Z",
      "event_toDate": "2026-03-22T00:00:00.000Z",
      "event_address": "Hall No. 12, Pragati Maidain",
      "event_country": "India",
      "event_state": "Delhi",
      "event_city": "New Delhi",
      "event_pincode": "121015",
      "event_status": "active",
      "added_by": "System"
    }
  ],
  "PrimaryProductInterest": [
    {
      "primary_product_interest": "AYUSH & Traditional Medicine",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": "69c65a953c974a6e14960028"
    },
    {
      "primary_product_interest": "Organic & Natural Products",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "primary_product_interest": "Wellness & Lifestyle",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "primary_product_interest": "Beauty & Personal Care",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "primary_product_interest": "Fitness & Nutrition",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "primary_product_interest": "Medical & Healthcare",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "primary_product_interest": "Pharmaceuticals",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    }
  ],
  "SecondaryProduct": [
    {
      "secondary_product_categories": "Ayurveda",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "secondary_product_categories": "Organic",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "secondary_product_categories": "Wellness",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "secondary_product_categories": "Pharma",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "secondary_product_categories": "Cosmetics",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "secondary_product_categories": "Nutraceuticals",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "secondary_product_categories": "Herbal",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "secondary_product_categories": "Skincare",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "secondary_product_categories": "Medical Devices",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "secondary_product_categories": "HealthTech",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    }
  ],
  "MeetingPriorityLevel": [
    {
      "meeting_priority_level": "test2",
      "status": "Inactive",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "meeting_priority_level": "Low Priority",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "meeting_priority_level": "Medium Priority",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "meeting_priority_level": "High Priority",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    }
  ],
  "Unit": [
    {
      "unit": "Nos.",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Piece",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Set",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Pair",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Pack",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Box",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Carton",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Kg",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Gram",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Litre",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Millilitre",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Meter",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Running Meter",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Square Meter",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Day",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "unit": "Hour",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    }
  ],
  "AnnualTurnover": [
    {
      "annual_turnover": "Below 50 Lakhs",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "annual_turnover": "50L – 2 Cr",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "annual_turnover": "2 – 10 Cr",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    },
    {
      "annual_turnover": "10 Cr+",
      "status": "Active",
      "added_by": "Admin",
      "updated_by": null
    }
  ],
  "BusinessType": [
    {
      "nature_id": "BT-1776145592517",
      "business_type": "Importer",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": "69c65a953c974a6e14960028"
    },
    {
      "nature_id": "BT-1776321197177",
      "business_type": "Manufacturer",
      "status": "Active",
      "added_by": "69ae89eb9078d35adbe72d51",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593190426",
      "business_type": "Distributor",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593206148",
      "business_type": "Super Distributor",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593216190",
      "business_type": "Wholesaler",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593232367",
      "business_type": "Retailer (Single Store)",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593241596",
      "business_type": "Retail Chain / Multi-Store",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593252879",
      "business_type": "Modern Trade Buyer",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593272261",
      "business_type": "Private Label Buyer",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593283006",
      "business_type": "Franchise Seeker",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593295547",
      "business_type": "Investor",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593304977",
      "business_type": "Importer",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593314670",
      "business_type": "Exporter",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593324159",
      "business_type": "International Buying Agent",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593336729",
      "business_type": "E-commerce Seller",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593345854",
      "business_type": "2. D2C Brand Owner",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593358026",
      "business_type": "Hospital / Clinic",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593367387",
      "business_type": "Doctor / Medical Practitioner",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593382409",
      "business_type": "Pharmacy / Chemist",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593390940",
      "business_type": "Diagnostic Center",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593402788",
      "business_type": "Spa / Salon Owner",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593413042",
      "business_type": "Wellness Center",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593421824",
      "business_type": "Gym / Fitness Center",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593430282",
      "business_type": "Yoga Studio",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593442819",
      "business_type": "Nutritionist / Dietician",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593466661",
      "business_type": "Wellness Resort / Hospitality",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593476587",
      "business_type": "Hotel / Resort",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593486497",
      "business_type": "Corporate Buyer (Procurement / HR)",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593495172",
      "business_type": "Government / PSU",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593502802",
      "business_type": "NGO / Trust",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593511749",
      "business_type": "Consultant / Advisor",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593519865",
      "business_type": "Startup Founder",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593529675",
      "business_type": "Student / Researcher",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    },
    {
      "nature_id": "BT-1776593538165",
      "business_type": "Other (Please Specify)",
      "status": "Active",
      "added_by": "69c65a953c974a6e14960028",
      "updated_by": null
    }
  ],
  "PreviousExhibition": [
    {
      "name": "Bharat Development & Schemes Expo",
      "year": 2016,
      "edition": "1st Edition",
      "status": "Active",
      "createdBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      },
      "updatedBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      }
    },
    {
      "name": "Agritech Innovate India",
      "year": 2017,
      "edition": "2nd Edition",
      "status": "Active",
      "createdBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      },
      "updatedBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      }
    },
    {
      "name": "The Yogshala Expo",
      "year": 2018,
      "edition": "3rd Edition",
      "status": "Active",
      "createdBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      },
      "updatedBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      }
    },
    {
      "name": "Punjab Health & Wellness Expo",
      "year": 2019,
      "edition": "4th Edition",
      "status": "Active",
      "createdBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      },
      "updatedBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      }
    },
    {
      "name": "MP Development Expo",
      "year": 2020,
      "edition": "5th Edition",
      "status": "Active",
      "createdBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      },
      "updatedBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      }
    },
    {
      "name": "Global Eco Tech Health Expo",
      "year": 2021,
      "edition": "6th Edition",
      "status": "Active",
      "createdBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      },
      "updatedBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      }
    },
    {
      "name": "Indo Himalayan Expo",
      "year": 2022,
      "edition": "7th Edition",
      "status": "Active",
      "createdBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      },
      "updatedBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      }
    },
    {
      "name": "Bharat Organic Expo",
      "year": 2023,
      "edition": "8th Edition",
      "status": "Active",
      "createdBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      },
      "updatedBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      }
    },
    {
      "name": "The Organic Expo",
      "year": 2024,
      "edition": "9th Edition",
      "status": "Active",
      "createdBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      },
      "updatedBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      }
    },
    {
      "name": "International Health & Wellness Expo (IHWE)",
      "year": 2025,
      "edition": "10th Edition",
      "status": "Active",
      "createdBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      },
      "updatedBy": {
        "userId": "6a0ea4156bc03faa4dd70900",
        "username": "vansh"
      }
    }
  ]
};

    await seedCollection(StatusOption, datasets.StatusOption, "statusOptions");
    await seedCollection(NatureOfBusiness, datasets.NatureOfBusiness, "natureOfBusiness");
    await seedCollection(CrmExhibitorCategory, datasets.CrmExhibitorCategory, "categories");
    await seedCollection(NextAction, datasets.NextAction, "nextActions");
    await seedCollection(CrmEvent, datasets.CrmEvent, "events");
    await seedCollection(PrimaryProductInterest, datasets.PrimaryProductInterest, "primaryProducts");
    await seedCollection(SecondaryProduct, datasets.SecondaryProduct, "secondaryProducts");
    await seedCollection(MeetingPriorityLevel, datasets.MeetingPriorityLevel, "priorities");
    await seedCollection(Unit, datasets.Unit, "units");
    await seedCollection(AnnualTurnover, datasets.AnnualTurnover, "turnovers");
    await seedCollection(BusinessType, datasets.BusinessType, "businessTypes");
    await seedCollection(PreviousExhibition, datasets.PreviousExhibition, "previousExhibitions");

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
