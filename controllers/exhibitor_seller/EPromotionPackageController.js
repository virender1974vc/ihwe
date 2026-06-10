const EPromotionPackage = require('../../models/exhibitor_seller/EPromotionPackage');
const EPromotionAddon = require('../../models/exhibitor_seller/EPromotionAddon');
const EPromotionReach = require('../../models/exhibitor_seller/EPromotionReach');
const EPromotionTestimonial = require('../../models/cms/EPromotionTestimonial');

class EPromotionPackageController {
    // ==========================================
    // PACKAGES CRUD
    // ==========================================

    // Get all packages
    async getAllPackages(req, res) {
        try {
            const query = {};
            const packages = await EPromotionPackage.find(query).sort({ order: 1 });
            res.status(200).json({
                success: true,
                data: packages
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error fetching packages",
                error: error.message
            });
        }
    }

    // Create a new package
    async createPackage(req, res) {
        try {
            const newPackage = new EPromotionPackage(req.body);
            await newPackage.save();
            res.status(201).json({
                success: true,
                data: newPackage
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: "Error creating package",
                error: error.message
            });
        }
    }

    // Update a package
    async updatePackage(req, res) {
        try {
            const updatedPackage = await EPromotionPackage.findByIdAndUpdate(
                req.params.id,
                req.body,
                { returnDocument: 'after', runValidators: true }
            );
            if (!updatedPackage) {
                return res.status(404).json({ success: false, message: "Package not found" });
            }
            res.status(200).json({
                success: true,
                data: updatedPackage
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: "Error updating package",
                error: error.message
            });
        }
    }

    // Delete a package
    async deletePackage(req, res) {
        try {
            const deletedPackage = await EPromotionPackage.findByIdAndDelete(req.params.id);
            if (!deletedPackage) {
                return res.status(404).json({ success: false, message: "Package not found" });
            }
            res.status(200).json({
                success: true,
                message: "Package deleted successfully"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error deleting package",
                error: error.message
            });
        }
    }

    // ==========================================
    // ADDONS CRUD
    // ==========================================

    // Get all addons
    async getAllAddons(req, res) {
        try {
            const addons = await EPromotionAddon.find({}).sort({ order: 1 });
            res.status(200).json({
                success: true,
                data: addons
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error fetching addons",
                error: error.message
            });
        }
    }

    // Create a new addon
    async createAddon(req, res) {
        try {
            const newAddon = new EPromotionAddon(req.body);
            await newAddon.save();
            res.status(201).json({
                success: true,
                data: newAddon
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: "Error creating addon",
                error: error.message
            });
        }
    }

    // Update an addon
    async updateAddon(req, res) {
        try {
            const updatedAddon = await EPromotionAddon.findByIdAndUpdate(
                req.params.id,
                req.body,
                { returnDocument: 'after', runValidators: true }
            );
            if (!updatedAddon) {
                return res.status(404).json({ success: false, message: "Addon not found" });
            }
            res.status(200).json({
                success: true,
                data: updatedAddon
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: "Error updating addon",
                error: error.message
            });
        }
    }

    // Delete an addon
    async deleteAddon(req, res) {
        try {
            const deletedAddon = await EPromotionAddon.findByIdAndDelete(req.params.id);
            if (!deletedAddon) {
                return res.status(404).json({ success: false, message: "Addon not found" });
            }
            res.status(200).json({
                success: true,
                message: "Addon deleted successfully"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error deleting addon",
                error: error.message
            });
        }
    }

    // ==========================================
    // REACH & IMPACT CRUD (Single Record)
    // ==========================================

    // Get reach
    async getReach(req, res) {
        try {
            let reach = await EPromotionReach.findOne({});
            if (!reach) {
                // Return default reach if none exists in DB
                reach = new EPromotionReach({
                    tradeVisitors: '20,000+',
                    exhibitors: '500+',
                    countries: '25+',
                    socialMediaReach: '500,000+',
                    emailReach: '100,000+'
                });
                await reach.save();
            }
            res.status(200).json({
                success: true,
                data: reach
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error fetching reach data",
                error: error.message
            });
        }
    }

    // Update reach
    async updateReach(req, res) {
        try {
            let reach = await EPromotionReach.findOne({});
            if (!reach) {
                reach = new EPromotionReach(req.body);
            } else {
                reach.tradeVisitors = req.body.tradeVisitors;
                reach.exhibitors = req.body.exhibitors;
                reach.countries = req.body.countries;
                reach.socialMediaReach = req.body.socialMediaReach;
                reach.emailReach = req.body.emailReach;
            }
            await reach.save();
            res.status(200).json({
                success: true,
                data: reach
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: "Error updating reach data",
                error: error.message
            });
        }
    }

    // ==========================================
    // TESTIMONIALS CRUD
    // ==========================================

    // Get all testimonials
    async getAllTestimonials(req, res) {
        try {
            const testimonials = await EPromotionTestimonial.find({}).sort({ order: 1 });
            res.status(200).json({
                success: true,
                data: testimonials
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error fetching testimonials",
                error: error.message
            });
        }
    }

    // Create a new testimonial
    async createTestimonial(req, res) {
        try {
            const newTestimonial = new EPromotionTestimonial(req.body);
            await newTestimonial.save();
            res.status(201).json({
                success: true,
                data: newTestimonial
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: "Error creating testimonial",
                error: error.message
            });
        }
    }

    // Update a testimonial
    async updateTestimonial(req, res) {
        try {
            const updatedTestimonial = await EPromotionTestimonial.findByIdAndUpdate(
                req.params.id,
                req.body,
                { returnDocument: 'after', runValidators: true }
            );
            if (!updatedTestimonial) {
                return res.status(404).json({ success: false, message: "Testimonial not found" });
            }
            res.status(200).json({
                success: true,
                data: updatedTestimonial
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: "Error updating testimonial",
                error: error.message
            });
        }
    }

    // Delete a testimonial
    async deleteTestimonial(req, res) {
        try {
            const deletedTestimonial = await EPromotionTestimonial.findByIdAndDelete(req.params.id);
            if (!deletedTestimonial) {
                return res.status(404).json({ success: false, message: "Testimonial not found" });
            }
            res.status(200).json({
                success: true,
                message: "Testimonial deleted successfully"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error deleting testimonial",
                error: error.message
            });
        }
    }

    // ==========================================
    // SEED ALL DEFAULTS
    // ==========================================
    async seedAll(req, res) {
        try {
            // 1. Seed Packages
            const initialPackages = [
                {
                    title: "STARTER VISIBILITY PACKAGE",
                    subtitle: "Build your presence and get notice online",
                    price: 12000,
                    gstText: "+18% GST",
                    features: [
                        "Featured Listing on Website",
                        "Logo on Exhibitor Directory Page",
                        "1 Social Media Promotion (1 Post)",
                        "Event Updates Inclusion",
                        "Standard Listing in Emailer"
                    ],
                    backgroundImage: "/images/9.png",
                    buttonText: "CHOOSE STARTER",
                    textColor: "text-green-800",
                    priceColor: "text-green-800",
                    order: 1
                },
                {
                    title: "GROWTH PROMOTION PACKAGE",
                    subtitle: "Increase engagement and generate more leads",
                    price: 24000,
                    gstText: "+18% GST",
                    features: [
                        "Everything in Starter Package",
                        "3 Social Media Promotions (3 Posts)",
                        "Featured Inclusion in 1 Email Campaign",
                        "Homepage Logo Highlight",
                        "WhatsApp Broadcast Inclusion",
                        "Event Updates & News Feature"
                    ],
                    backgroundImage: "/images/10.png",
                    buttonText: "CHOOSE GROWTH",
                    badgeText: "MOST POPULAR",
                    borderColor: "#e8a415",
                    textColor: "text-[#e8a415]",
                    priceColor: "text-[#d99504]",
                    order: 2
                },
                {
                    title: "PREMIUM BRANDING PACKAGE",
                    subtitle: "Maximize Visibility and dominate your category",
                    price: 45000,
                    gstText: "+18% GST",
                    features: [
                        "Everything in Growth Package",
                        "Homepage Banner Promotion (7 Days)",
                        "Dedicated Email Campaign",
                        "5 Social Media Promotions (5 Posts)",
                        "WhatsApp Marketing Push",
                        "Priority Listing & Branding Support"
                    ],
                    backgroundImage: "/images/11.png",
                    buttonText: "CHOOSE PREMIUM",
                    textColor: "text-gray-300",
                    priceColor: "text-gray-300",
                    order: 3
                }
            ];

            await EPromotionPackage.deleteMany({});
            const packages = await EPromotionPackage.insertMany(initialPackages);

            // 2. Seed Add-ons
            const initialAddons = [
                { name: "Homepage Banner Ad (7 Days)", price: "₹ 15,000", order: 1 },
                { name: "Category Sponsorship", price: "₹ 25,000", order: 2 },
                { name: "Featured Brand of the Day", price: "₹ 10,000", order: 3 },
                { name: "Push Notification Alert (App)", price: "₹ 8,000", order: 4 },
                { name: "Influencer Collaboration", price: "₹ 20,000", order: 5 },
                { name: "Additional Email Campaign", price: "₹ 10,000", order: 6 }
            ];

            await EPromotionAddon.deleteMany({});
            const addons = await EPromotionAddon.insertMany(initialAddons);

            // 3. Seed Reach & Impact
            const initialReach = {
                tradeVisitors: '20,000+',
                exhibitors: '500+',
                countries: '25+',
                socialMediaReach: '500,000+',
                emailReach: '100,000+'
            };

            await EPromotionReach.deleteMany({});
            const reach = new EPromotionReach(initialReach);
            await reach.save();

            // 4. Seed Testimonials
            const initialTestimonials = [
                {
                    text: "IHWE digital promotion helped us reach the right audience before the event. We generated quality leads even before the exhibition started.",
                    name: "Exhibitor, IHWE 2025",
                    order: 1
                },
                {
                    text: "The email campaigns and social media promotions gave our brand excellent visibility across the industry.",
                    name: "Marketing Partner",
                    order: 2
                },
                {
                    text: "We received strong visitor engagement and genuine business inquiries through the online promotion package.",
                    name: "International Exhibitor",
                    order: 3
                }
            ];

            await EPromotionTestimonial.deleteMany({});
            const testimonials = await EPromotionTestimonial.insertMany(initialTestimonials);

            res.status(201).json({
                success: true,
                message: "All E-Promotion components seeded successfully!",
                data: {
                    packages,
                    addons,
                    reach,
                    testimonials
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error seeding E-Promotion components",
                error: error.message
            });
        }
    }
}

module.exports = new EPromotionPackageController();
