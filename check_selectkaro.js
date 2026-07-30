const mongoose = require('mongoose');
require('dotenv').config({ path: '/Users/rohitkumar/Documents/Encodency Pvt/9th IHWE/backend/.env' });

mongoose.connect(process.env.MONGO_URI_MAIN)
  .then(async () => {
    const Company = require('/Users/rohitkumar/Documents/Encodency Pvt/9th IHWE/backend/models/Company.js');
    const companies = await Company.find({ companyName: /selectkaro/i });
    console.log("Companies:", JSON.stringify(companies, null, 2));
    
    const ExhibitorRegistration = require('/Users/rohitkumar/Documents/Encodency Pvt/9th IHWE/backend/models/ExhibitorRegistration.js');
    const regs = await ExhibitorRegistration.find({ _id: "6a687f68200fe4b74fa45535" });
    console.log("ExhibitorRegistrations:", JSON.stringify(regs, null, 2));

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
