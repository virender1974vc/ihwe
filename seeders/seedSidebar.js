const mongoose = require('mongoose');
const SidebarItem = require('./models/SidebarItem');
require('dotenv').config();

const seedSidebar = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for sidebar seed');

        const count = await SidebarItem.countDocuments();
        if (count > 0) {
            console.log('Sidebar items already exist. Skipping seed.');
            mongoose.connection.close();
            return;
        }

        const items = [
            // MAIN NAVIGATION
            { label: 'MAIN NAVIGATION', type: 'heading', order: 0 },
            { label: 'Dashboard', type: 'item', path: '/dashboard', icon: 'LayoutDashboard', order: 1 },

            // CONTENT MANAGEMENT
            { label: 'CONTENT MANAGEMENT', type: 'heading', order: 2 },
            { label: 'Home Slider', type: 'item', path: '/home-slider', icon: 'Images', order: 3 },
            { label: 'About Us', type: 'item', path: '/about', icon: 'Info', order: 4 },
            { label: 'Services', type: 'item', path: '/services', icon: 'Briefcase', order: 5 },
            { label: 'Testimonials', type: 'item', path: '/testimonials', icon: 'Quote', order: 6 },

            // ADMINISTRATION
            { label: 'ADMINISTRATION', type: 'heading', order: 7 },
            { label: 'Admin Users', type: 'item', path: '/users', icon: 'Users', order: 8 },
            { label: 'Change Password', type: 'item', path: '/change-password', icon: 'KeyRound', order: 9 },
        ];

        await SidebarItem.insertMany(items);
        console.log('Sidebar items seeded successfully!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Sidebar seed error:', err.message);
        process.exit(1);
    }
};

seedSidebar();
