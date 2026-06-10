const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function run() {
  try {
    const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
    await mongoose.connect(uri);
    
    let user = await User.findOne({ username: 'testadmin' });
    if (!user) {
      user = new User({
        username: 'testadmin',
        role: 'Super Admin',
      });
    }
    user.password = 'admin123';
    await user.save();
    console.log('Successfully set password for testadmin to admin123');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
run();
