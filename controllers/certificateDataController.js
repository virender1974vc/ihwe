const CertificateData = require('../models/certificateData');
const path = require('path');
const fs = require('fs');

// Helper to get or create the single config record
const getOrCreateConfig = async () => {
    let config = await CertificateData.findOne();
    if (!config) {
        config = new CertificateData();
        await config.save();
    }
    return config;
};

exports.getCertificateData = async (req, res) => {
    try {
        const config = await getOrCreateConfig();
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Error fetching certificate data:', error);
        res.status(500).json({ success: false, message: 'Server error fetching certificate data' });
    }
};

exports.updateCertificateData = async (req, res) => {
    try {
        const config = await getOrCreateConfig();
        
        // Update text fields
        const { certi_name, sign1_name, sign1_designation, sign2_name, sign2_designation } = req.body;
        if (certi_name) config.certi_name = certi_name;
        if (sign1_name) config.sign1_name = sign1_name;
        if (sign1_designation) config.sign1_designation = sign1_designation;
        if (sign2_name) config.sign2_name = sign2_name;
        if (sign2_designation) config.sign2_designation = sign2_designation;

        // Process existing bulk files passed in body
        let existingNamo = req.body.existing_namo_logos ? JSON.parse(req.body.existing_namo_logos) : [];
        let existingConcurrent = req.body.existing_concurrent_events ? JSON.parse(req.body.existing_concurrent_events) : [];

        // If 'existing_namo_logos' or 'existing_concurrent_events' is explicitly sent (even as empty array),
        // we start with that base to allow deletions. If undefined, we don't modify unless new files uploaded.
        if (req.body.existing_namo_logos !== undefined) {
            config.namo_gange_trust_logos = existingNamo;
        }
        if (req.body.existing_concurrent_events !== undefined) {
            config.concurrent_events = existingConcurrent;
        }

        // Process files
        if (req.files) {
            if (req.files.expo_logo && req.files.expo_logo[0]) {
                config.expo_logo = `/uploads/certificate/${req.files.expo_logo[0].filename}`;
            }
            if (req.files.sign1_image && req.files.sign1_image[0]) {
                config.sign1_image = `/uploads/certificate/${req.files.sign1_image[0].filename}`;
            }
            if (req.files.sign2_image && req.files.sign2_image[0]) {
                config.sign2_image = `/uploads/certificate/${req.files.sign2_image[0].filename}`;
            }
            if (req.files.namo_gange_trust_logos) {
                const newNamoUrls = req.files.namo_gange_trust_logos.map(f => `/uploads/certificate/${f.filename}`);
                config.namo_gange_trust_logos = [...existingNamo, ...newNamoUrls];
            }
            if (req.files.concurrent_events) {
                const newEventUrls = req.files.concurrent_events.map(f => `/uploads/certificate/${f.filename}`);
                config.concurrent_events = [...existingConcurrent, ...newEventUrls];
            }
        }

        await config.save();
        res.status(200).json({ success: true, message: 'Certificate data updated successfully', data: config });
    } catch (error) {
        console.error('Error updating certificate data:', error);
        res.status(500).json({ success: false, message: 'Server error updating certificate data' });
    }
};
