const BSMTestimonial = require('../../models/buyer_saller_meet/BSMTestimonial');

class BSMTestimonialController {
    // Get all testimonials (filtered for frontend, unfiltered for admin)
    async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const isAdmin = req.query.admin === 'true';

            const query = isAdmin ? {} : { isActive: true };
            
            const [testimonials, total] = await Promise.all([
                BSMTestimonial.find(query)
                    .sort({ order: 1, createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                BSMTestimonial.countDocuments(query)
            ]);

            res.status(200).json({
                success: true,
                data: testimonials,
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
                message: "Error fetching testimonials",
                error: error.message
            });
        }
    }

    // Create a new testimonial
    async create(req, res) {
        try {
            const testimonial = new BSMTestimonial(req.body);
            await testimonial.save();
            res.status(201).json({
                success: true,
                data: testimonial
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
    async update(req, res) {
        try {
            const updated = await BSMTestimonial.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!updated) {
                return res.status(404).json({ success: false, message: "Testimonial not found" });
            }
            res.status(200).json({
                success: true,
                data: updated
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
    async delete(req, res) {
        try {
            const deleted = await BSMTestimonial.findByIdAndDelete(req.params.id);
            if (!deleted) {
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

    // Seed initial data
    async seed(req, res) {
        try {
            const initialData = [
                { text: 'We connected with 15+ serious buyers in one day – highly effective platform.', name: 'Director', designation: 'Herbal Wellness Pvt. Ltd.', order: 1 },
                { text: 'The pre-scheduled meetings saved time and gave us quality business opportunities.', name: 'Business Head', designation: 'Organic India', order: 2 },
                { text: 'A well-organized event that helped us expand our reach globally and meet the right partners.', name: 'CEO', designation: 'Global Wellness', order: 3 },
                { text: 'Excellent matchmaking! We closed several deals during the expo itself.', name: 'VP Sales', designation: 'NutriLife', order: 4 },
            ];

            await BSMTestimonial.deleteMany({});
            const seeded = await BSMTestimonial.insertMany(initialData);

            res.status(201).json({
                success: true,
                message: "BSM Testimonials seeded successfully",
                data: seeded
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error seeding testimonials",
                error: error.message
            });
        }
    }
}

module.exports = new BSMTestimonialController();
