const mongoose = require('mongoose');
require('dotenv').config({ path: '/Users/rohitkumar/Documents/Encodency Pvt/9th IHWE/backend/.env' });

mongoose.connect(process.env.MONGO_URI_MAIN)
  .then(async () => {
    const CrmEvent = require('/Users/rohitkumar/Documents/Encodency Pvt/9th IHWE/backend/models/CrmEvent.js');
    const Event = require('/Users/rohitkumar/Documents/Encodency Pvt/9th IHWE/backend/models/Event.js');
    
    const ev1 = await CrmEvent.findById("68ff46097debd52c00738036");
    console.log("68ff46... (CrmEvent):", ev1 ? ev1.event_name : "Not Found");
    
    const ev2 = await CrmEvent.findById("69edb20efdd846637abaaee0");
    console.log("69edb2... (CrmEvent):", ev2 ? ev2.event_name : "Not Found");
    
    const ev3 = await Event.findById("68ff46097debd52c00738036");
    console.log("68ff46... (Event):", ev3 ? ev3.name : "Not Found");
    
    const ev4 = await Event.findById("69edb20efdd846637abaaee0");
    console.log("69edb2... (Event):", ev4 ? ev4.name : "Not Found");

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
