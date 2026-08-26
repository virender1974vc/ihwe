const SponsorsAndAttend = require('../../../models/organic_expo/home/SponsorsAndAttend');

class SponsorsAndAttendController {
    async getSponsorsAndAttend(req, res) {
        try {
            let data = await SponsorsAndAttend.findOne();
            if (!data) {
                data = await SponsorsAndAttend.create({});
            }
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch SponsorsAndAttend error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async updateSponsorsAndAttend(req, res) {
        try {
            let updateData = { ...req.body };
            
            // Parse nested JSON strings if they come from formData or JSON stringified body
            if (typeof updateData.leftSection === 'string') {
                updateData.leftSection = JSON.parse(updateData.leftSection);
            }
            if (typeof updateData.centerSection === 'string') {
                updateData.centerSection = JSON.parse(updateData.centerSection);
            }
            if (typeof updateData.rightSection === 'string') {
                updateData.rightSection = JSON.parse(updateData.rightSection);
            }

            const data = await SponsorsAndAttend.findOneAndUpdate({}, updateData, { new: true, upsert: true });
            res.json({ success: true, data, message: 'Sponsors and Attend updated successfully' });
        } catch (error) {
            console.error('Update SponsorsAndAttend error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new SponsorsAndAttendController();
