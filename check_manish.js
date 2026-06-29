const mongoose = require("mongoose");
const Company = require("./models/Company");
const dotenv = require("dotenv");
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        const leads = await Company.find({
            $or: [{ added_by: { $in: ["manish", "Manish Sirohi"] } }, { forwardTo: { $in: ["manish", "Manish Sirohi"] } }]
        }, { companyStatus: 1, added_by: 1, forwardTo: 1, companyName: 1 }).lean();
        console.log("Leads for Manish:", leads);
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
check();
