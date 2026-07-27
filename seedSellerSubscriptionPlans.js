const mongoose = require('mongoose');
const SellerSubscriptionPlan = require('./models/add_by_admin/SellerSubscriptionPlan');
require('dotenv').config();

const seedSellerSubscriptionPlans = async () => {
    try {
        const mongoUri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI;
        
        if (!mongoUri) {
            throw new Error('MongoDB URI not found in environment variables');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB for Seller Subscription Plans seed');

        const initialPlans = [
            {
                name: "Starter",
                price: 9999,
                currency: "INR",
                durationDays: 365,
                maxLeads: 5,
                maxExportInquiries: 0,
                maxServiceRequests: 0,
                description: "5 Verified Meetings",
                status: "active",
                displayOrder: 1,
                features: [
                    { key: "pre_scheduled_meetings", label: "15 Pre-scheduled Meetings", enabled: true },
                    { key: "verified_buyer_access", label: "Verified Buyer Access", enabled: true },
                    { key: "meeting_scheduler", label: "Meeting Scheduler Access", enabled: true }
                ]
            },
            {
                name: "Growth",
                price: 24999,
                currency: "INR",
                durationDays: 365,
                maxLeads: 15,
                maxExportInquiries: 0,
                maxServiceRequests: 0,
                description: "15 Verified Meetings",
                status: "active",
                displayOrder: 2,
                features: [
                    { key: "pre_scheduled_meetings", label: "15 Pre-scheduled Meetings", enabled: true },
                    { key: "verified_buyer_access", label: "Verified Buyer Access", enabled: true },
                    { key: "meeting_scheduler", label: "Priority Meeting Scheduler", enabled: true },
                    { key: "analytics_dashboard", label: "Meeting Analytics Report", enabled: true }
                ]
            },
            {
                name: "Pro",
                price: 44999,
                currency: "INR",
                durationDays: 365,
                maxLeads: 30,
                maxExportInquiries: 0,
                maxServiceRequests: 0,
                description: "30 Verified Meetings",
                status: "active",
                displayOrder: 3,
                features: [
                    { key: "pre_scheduled_meetings", label: "30 Pre-scheduled Meetings", enabled: true },
                    { key: "verified_buyer_access", label: "Verified Buyer Access", enabled: true },
                    { key: "meeting_scheduler", label: "Priority Meeting Scheduler", enabled: true },
                    { key: "analytics_dashboard", label: "Meeting Analytics Report", enabled: true },
                    { key: "featured_buyer_list", label: "Featured in Buyer List", enabled: true }
                ]
            }
        ];

        // Clear existing plans
        await SellerSubscriptionPlan.deleteMany({});
        console.log('🗑️ Existing plans cleared');

        // Insert new plans
        await SellerSubscriptionPlan.insertMany(initialPlans);
        console.log('✨ Seller Subscription Plans seeded successfully!');

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
};

seedSellerSubscriptionPlans();
