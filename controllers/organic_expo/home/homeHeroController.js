const HomeHero = require('../../../models/organic_expo/home/HomeHero');

class HomeHeroController {
    async getHomeHero(req, res) {
        try {
            let data = await HomeHero.findOne();
            if (!data) data = await HomeHero.create({});
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch HomeHero error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async updateHomeHero(req, res) {
        try {
            let updateData = { ...req.body };
            if (req.file) {
                updateData.img = `/uploads/organic_expo/${req.file.filename}`;
            }
            const data = await HomeHero.findOneAndUpdate({}, updateData, { new: true, upsert: true });
            res.json({ success: true, data, message: 'Home Hero updated successfully' });
        } catch (error) {
            console.error('Update HomeHero error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}
module.exports = new HomeHeroController();
