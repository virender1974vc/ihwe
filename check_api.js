const mongoose = require("mongoose");
const Company = require("./models/Company");
const dotenv = require("dotenv");
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        const leads = await Company.find({ companyStatus: "New Lead" }).lean();
        console.log("Leads found by query:", leads.length);
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
check();
