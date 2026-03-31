const User = require('../models/User');
const FeaturedServices = require('../models/FeaturedServices');
const GalleryItem = require('../models/GalleryItem');
const Hero = require('../models/Hero');
const Testimonial = require('../models/Testimonial');
const PartnerGroup = require('../models/PartnerGroup');
const Blog = require('../models/Blog');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const ContactEnquiry = require('../models/ContactEnquiry');
const BuyerRegistration = require('../models/BuyerRegistration');

exports.getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            servicesDoc,
            totalProjects,
            totalHomeCarousel,
            totalTestimonials,
            totalPartners,
            totalBlogs,
            totalExhibitorBookings,
            totalContactQueries,
            totalBuyerRegistrations
        ] = await Promise.all([
            User.countDocuments(),
            FeaturedServices.findOne({}),
            GalleryItem.countDocuments(),
            Hero.countDocuments(),
            Testimonial.countDocuments(),
            PartnerGroup.countDocuments(),
            Blog.countDocuments(),
            ExhibitorRegistration.countDocuments(),
            ContactEnquiry.countDocuments(),
            BuyerRegistration.countDocuments()
        ]);

        const totalServices = servicesDoc ? (servicesDoc.cards ? servicesDoc.cards.length : 0) : 0;
        const months = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push({
                name: monthNames[d.getMonth()],
                month: d.getMonth() + 1,
                year: d.getFullYear()
            });
        }

        const trends = await Promise.all(months.map(async (m) => {
            const start = new Date(m.year, m.month - 1, 1);
            const end = new Date(m.year, m.month, 0, 23, 59, 59);

            const [projects, leads, registrations] = await Promise.all([
                GalleryItem.countDocuments({ createdAt: { $gte: start, $lte: end } }),
                ContactEnquiry.countDocuments({ createdAt: { $gte: start, $lte: end } }),
                BuyerRegistration.countDocuments({ createdAt: { $gte: start, $lte: end } })
            ]);

            return {
                month: m.name,
                services: projects || 0, // Using projects as proxy if services don't have timestamps
                projects: projects || 0,
                leads: leads || 0,
                registrations: registrations || 0
            };
        }));

        // Get distribution (for pie chart)
        const categories = await GalleryItem.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        const distribution = categories.map((cat, index) => ({
            name: cat._id || "Uncategorized",
            value: cat.count,
            color: index === 0 ? '#4f46e5' : index === 1 ? '#10b981' : index === 2 ? '#f59e0b' : '#3b82f6'
        })).slice(0, 5);

        // Recent contacts
        const recentContacts = await ContactEnquiry.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email phone service status createdAt');

        res.json({
            success: true,
            data: {
                counts: {
                    totalUsers,
                    totalServices,
                    totalProjects,
                    totalHomeCarousel,
                    totalTestimonials,
                    totalClients: totalPartners,
                    totalBlogs,
                    totalBookings: totalExhibitorBookings,
                    totalContactQueries,
                    totalBuyerRegistrations
                },
                charts: {
                    trends,
                    distribution: distribution.length > 0 ? distribution : [{ name: 'No Media', value: 1, color: '#e2e8f0' }]
                },
                recentContacts
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: "Error fetching stats" });
    }
};
