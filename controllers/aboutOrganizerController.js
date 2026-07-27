const AboutOrganizer = require('../models/AboutOrganizer');
const path = require('path');
const fs = require('fs');

exports.getAboutOrganizer = async (req, res) => {
    try {
        let data = await AboutOrganizer.findOne();
        if (!data) {
            data = new AboutOrganizer();
            await data.save();
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAboutOrganizer = async (req, res) => {
    try {
        const updateData = req.body;
        let data = await AboutOrganizer.findOne();
        
        if (data) {
            Object.assign(data, updateData);
            data.updatedAt = Date.now();
            await data.save();
        } else {
            data = new AboutOrganizer(updateData);
            await data.save();
        }
        
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const imageUrl = `/uploads/about/${req.file.filename}`;
        res.status(200).json({ success: true, imageUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
