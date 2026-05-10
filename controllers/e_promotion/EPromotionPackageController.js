const EPromotionPackage = require('../../models/e_promotion/EPromotionPackage');

class EPromotionPackageController {
    // Get all active packages with pagination
    async getAllPackages(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const query = {}; // Add conditions if needed, e.g., { isActive: true }
            
            const [packages, total] = await Promise.all([
                EPromotionPackage.find(query)
                    .sort({ order: 1 })
                    .skip(skip)
                    .limit(limit),
                EPromotionPackage.countDocuments(query)
            ]);

            res.status(200).json({
                success: true,
                data: packages,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
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
                { new: true, runValidators: true }
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

    // Seed initial data based on user request
    async seedPackages(req, res) {
        try {
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

            await EPromotionPackage.deleteMany({}); // Optional: clear existing
            const createdPackages = await EPromotionPackage.insertMany(initialPackages);

            res.status(201).json({
                success: true,
                message: "Packages seeded successfully",
                data: createdPackages
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error seeding packages",
                error: error.message
            });
        }
    }
}

module.exports = new EPromotionPackageController();
