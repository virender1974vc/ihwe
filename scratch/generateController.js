const fs = require('fs');
const path = require('path');

const dumpPath = path.join(__dirname, 'masterDataDump.json');
const controllerPath = path.join(__dirname, '../controllers/seedMasterDataController.js');

const rawData = fs.readFileSync(dumpPath, 'utf8');
const data = JSON.parse(rawData);

// Utility to clean objects
function cleanArray(arr) {
  return arr.map(obj => {
    const newObj = { ...obj };
    delete newObj._id;
    delete newObj.__v;
    delete newObj.added;
    delete newObj.updated;
    delete newObj.createdAt;
    delete newObj.updatedAt;
    delete newObj.cat_added;
    delete newObj.cat_updated;
    delete newObj.nature_added;
    return newObj;
  });
}

const cleanedData = {
  StatusOption: cleanArray(data.StatusOption),
  NatureOfBusiness: cleanArray(data.NatureOfBusiness),
  CrmExhibitorCategory: cleanArray(data.CrmExhibitorCategory),
  NextAction: cleanArray(data.NextAction),
  CrmEvent: cleanArray(data.CrmEvent),
  PrimaryProductInterest: cleanArray(data.PrimaryProductInterest),
  SecondaryProduct: cleanArray(data.SecondaryProduct),
  MeetingPriorityLevel: cleanArray(data.MeetingPriorityLevel),
  Unit: cleanArray(data.Unit),
  AnnualTurnover: cleanArray(data.AnnualTurnover),
  BusinessType: cleanArray(data.BusinessType),
  PreviousExhibition: cleanArray(data.PreviousExhibition),
};

const controllerCode = `const mongoose = require("mongoose");
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

    const datasets = ${JSON.stringify(cleanedData, null, 2)};

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
`;

fs.writeFileSync(controllerPath, controllerCode);
console.log('Controller regenerated successfully at', controllerPath);
