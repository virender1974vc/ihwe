require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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

async function dumpData() {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    console.log("Connected to DB");
    const data = {
      StatusOption: await StatusOption.find().lean(),
      NatureOfBusiness: await NatureOfBusiness.find().lean(),
      CrmExhibitorCategory: await CrmExhibitorCategory.find().lean(),
      NextAction: await NextAction.find().lean(),
      CrmEvent: await CrmEvent.find().lean(),
      PrimaryProductInterest: await PrimaryProductInterest.find().lean(),
      SecondaryProduct: await SecondaryProduct.find().lean(),
      MeetingPriorityLevel: await MeetingPriorityLevel.find().lean(),
      Unit: await Unit.find().lean(),
      AnnualTurnover: await AnnualTurnover.find().lean(),
      BusinessType: await BusinessType.find().lean(),
      PreviousExhibition: await PreviousExhibition.find().lean(),
    };

    const outPath = path.join(__dirname, 'masterDataDump.json');
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log('Dump completed to', outPath);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// wait for connection
setTimeout(dumpData, 2000);
