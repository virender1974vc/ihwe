const aboutService = require('../services/aboutService');

/**
 * Controller to handle About section requests.
 */
class AboutController {
    /**
     * Get about data.
     */
    async getAboutData(req, res) {
        try {
            const data = await aboutService.getAboutData();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch about error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update about text data.
     */
    async updateAboutText(req, res) {
        try {
            const data = await aboutService.updateAboutText(req.body);
            res.json({ success: true, data, message: 'About content updated successfully' });
        } catch (error) {
            console.error('Update about error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload and update about video.
     */
    async updateAboutVideo(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a video file' });
            const videoPath = `/uploads/about/${req.file.filename}`;
            await aboutService.updateAboutVideo(videoPath);
            res.json({ success: true, videoPath, message: 'Video uploaded successfully' });
        } catch (error) {
            console.error('Upload video error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new AboutController();
