const AboutOrganizer = require('../models/AboutOrganizer');
const path = require('path');
const fs = require('fs');

const normalizeProject = (project) => ['ihwe', 'organicexpo'].includes(project) ? project : 'organicexpo';
const getProjectQuery = (project) => {
    const normalizedProject = normalizeProject(project);
    return normalizedProject === 'organicexpo'
        ? { $or: [{ project: normalizedProject }, { project: { $exists: false } }] }
        : { project: normalizedProject };
};

exports.getAboutOrganizer = async (req, res) => {
    try {
        const project = normalizeProject(req.query.project);
        let data = await AboutOrganizer.findOne(getProjectQuery(project));
        if (!data) {
            data = new AboutOrganizer({ project });
            await data.save();
        } else if (data.project !== project) {
            data.project = project;
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
        const project = normalizeProject(req.body.project || req.query.project);
        let data = await AboutOrganizer.findOne(getProjectQuery(project));
        
        if (data) {
            Object.assign(data, updateData);
            data.project = project;
            data.updatedAt = Date.now();
            await data.save();
        } else {
            data = new AboutOrganizer({ ...updateData, project });
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
