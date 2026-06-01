const ExhibitorHeroSlider = require('../models/ExhibitorHeroSlider');
const path = require('path');
const fs = require('fs');

exports.getImages = async (req, res) => {
    try {
        const images = await ExhibitorHeroSlider.find().sort({ createdAt: -1 });
        res.json({ success: true, data: images });
    } catch (error) {
        console.error('Error fetching exhibitor hero slider images:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.addImage = async (req, res) => {
    try {
        const { image, imageAlt } = req.body;
        const updatedBy = req.user?.username || 'Admin';

        if (!image) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        const newImage = new ExhibitorHeroSlider({
            image,
            imageAlt,
            createdBy: updatedBy,
            updatedBy
        });

        await newImage.save();
        res.json({ success: true, data: newImage, message: 'Image added successfully' });
    } catch (error) {
        console.error('Error adding exhibitor hero slider image:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const imageId = req.params.id;
        const imageRecord = await ExhibitorHeroSlider.findById(imageId);
        
        if (!imageRecord) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        // Delete the file if it exists
        if (imageRecord.image) {
            const fileName = path.basename(imageRecord.image);
            const filePath = path.join(__dirname, '../uploads/exhibitor-hero-slider', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await ExhibitorHeroSlider.findByIdAndDelete(imageId);
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting exhibitor hero slider image:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }
        const imageUrl = `/uploads/exhibitor-hero-slider/${req.file.filename}`;
        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
