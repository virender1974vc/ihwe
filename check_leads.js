const mongoose = require("mongoose");
const Company = require("./models/Company");
const dotenv = require("dotenv");
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        const queryUsers = ["vansh", "Vansh Chaudhary", "rohit", "Rohit Kumar", "manish", "Manish Sirohi"];
        const query = { 
            companyStatus: "New Lead",
            $or: [{ added_by: { $in: queryUsers } }, { forwardTo: { $in: queryUsers } }]
        };

        const leadsToReassign = await Company.find(query).lean();
        console.log("Leads matching New Lead and our users:", leadsToReassign.length);
        
        const allNewLeads = await Company.find({companyStatus: "New Lead"}).lean();
        console.log("All New Leads:", allNewLeads.length);
        if (allNewLeads.length > 0) {
            console.log("Sample New Lead:", {
                added_by: allNewLeads[0].added_by,
                forwardTo: allNewLeads[0].forwardTo,
                name: allNewLeads[0].companyName
            });
        }
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
check();
