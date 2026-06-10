const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function run() {
  try {
    const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
    await mongoose.connect(uri);
    const users = await User.find({}, 'username role email mobile');
    console.log('--- ADMIN USERS ---');
    console.log(users);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
run();
