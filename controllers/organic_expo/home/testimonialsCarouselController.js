const TestimonialsCarousel = require('../../../models/organic_expo/home/TestimonialsCarousel');

class TestimonialsCarouselController {
    async getTestimonials(req, res) {
        try {
            let data = await TestimonialsCarousel.findOne();
            if (!data) {
                data = await TestimonialsCarousel.create({});
            }
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch TestimonialsCarousel error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async updateTestimonials(req, res) {
        try {
            let updateData = { ...req.body };
            
            // Parse nested JSON strings if they come from formData or JSON stringified body
            if (typeof updateData.testimonials === 'string') {
                updateData.testimonials = JSON.parse(updateData.testimonials);
            }

            const data = await TestimonialsCarousel.findOneAndUpdate({}, updateData, { new: true, upsert: true });
            res.json({ success: true, data, message: 'Testimonials updated successfully' });
        } catch (error) {
            console.error('Update TestimonialsCarousel error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new TestimonialsCarouselController();
