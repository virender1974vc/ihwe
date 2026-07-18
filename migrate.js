require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI_MAIN).then(async () => {
    const db = mongoose.connection.db;
    const certData = db.collection('certificatedatas');
    
    // Delete all configs except 'default'
    await certData.deleteMany({ type: { $ne: 'default' } });
    
    console.log('Deleted all non-default blank configs');
    process.exit(0);
}).catch(console.error);
