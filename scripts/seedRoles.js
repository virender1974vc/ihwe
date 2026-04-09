const mongoose = require('mongoose');
require('dotenv').config();
const Role = require('../models/Role');

const roles = [
    { name: 'Super Admin', description: 'Full system access' },
    { name: 'Accountant Admin', description: 'Financial management and reports' },
    { name: 'Accountant Employee', description: 'Finance tasks and entry' },
    { name: 'Marketing Admin', description: 'Marketing campaigns management' },
    { name: 'Marketing Employee', description: 'Marketing execution' },
    { name: 'Digital Admin', description: 'Digital assets management' },
    { name: 'Digital Employee', description: 'Digital tasks execution' },
    { name: 'General Employee', description: 'Standard employee access' }
];

const seedRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('Connected to DB');

        for (const roleData of roles) {
            const exists = await Role.findOne({ name: roleData.name });
            if (!exists) {
                await Role.create({
                    ...roleData,
                    createdBy: 'System Seed'
                });
                console.log(`Created role: ${roleData.name}`);
            } else {
                console.log(`Role already exists: ${roleData.name}`);
            }
        }

        console.log('Seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedRoles();
