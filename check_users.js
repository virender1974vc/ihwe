const mongoose = require("mongoose");
const User = require("./models/User");
const dotenv = require("dotenv");
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        const users = await User.find({}, { username: 1, fullName: 1 }).lean();
        console.log("Users:", users);
        
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
check();
