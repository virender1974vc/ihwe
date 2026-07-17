const CertificateData = require('../models/CertificateData');
const path = require('path');
const fs = require('fs');

// Helper to get or create the config record for a specific type
const getOrCreateConfig = async (type = 'default') => {
    let config = await CertificateData.findOne({ type });
    
    // If not found, check if there's an old config without a type (legacy data)
    if (!config && type === 'default') {
        const legacyConfig = await CertificateData.findOne({ type: { $exists: false } });
        if (legacyConfig) {
            legacyConfig.type = 'default';
            await legacyConfig.save();
            return legacyConfig;
        }
    }

    if (!config) {
        if (type !== 'default') {
            const defaultConfig = await CertificateData.findOne({ type: 'default' });
            if (defaultConfig) {
                const newConfigData = defaultConfig.toObject();
                delete newConfigData._id;
                delete newConfigData.createdAt;
                delete newConfigData.updatedAt;
                newConfigData.type = type;
                config = new CertificateData(newConfigData);
            } else {
                config = new CertificateData({ type });
            }
        } else {
            config = new CertificateData({ type: 'default' });
        }
        await config.save();
    }
    return config;
};

exports.getCertificateData = async (req, res) => {
    try {
        const type = req.query.type || 'default';
        const config = await getOrCreateConfig(type);
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Error fetching certificate data:', error);
        res.status(500).json({ success: false, message: 'Server error fetching certificate data' });
    }
};

exports.updateCertificateData = async (req, res) => {
    try {
        const type = req.body.type || 'default';
        const config = await getOrCreateConfig(type);
        
        // Update text fields
        const { 
            certi_name, certi_desc1, certi_desc1_part2, certi_desc2, certi_desc3, certi_address, 
            sign1_name, sign1_designation, sign2_name, sign2_designation,
            header_left_heading, header_center_text, header_right_heading,
            header_left_enable, header_center_enable, header_right_enable,
            header_right_bottom_heading, header_right_bottom_enable
        } = req.body;
        
        if (certi_name !== undefined) config.certi_name = certi_name;
        if (certi_desc1 !== undefined) config.certi_desc1 = certi_desc1;
        if (certi_desc1_part2 !== undefined) config.certi_desc1_part2 = certi_desc1_part2;
        if (certi_desc2 !== undefined) config.certi_desc2 = certi_desc2;
        if (certi_desc3 !== undefined) config.certi_desc3 = certi_desc3;
        if (certi_address !== undefined) config.certi_address = certi_address;
        if (sign1_name !== undefined) config.sign1_name = sign1_name;
        if (sign1_designation !== undefined) config.sign1_designation = sign1_designation;
        if (sign2_name !== undefined) config.sign2_name = sign2_name;
        if (sign2_designation !== undefined) config.sign2_designation = sign2_designation;
        
        if (header_left_heading !== undefined) config.header_left_heading = header_left_heading;
        if (header_center_text !== undefined) config.header_center_text = header_center_text;
        if (header_right_heading !== undefined) config.header_right_heading = header_right_heading;
        if (header_right_bottom_heading !== undefined) config.header_right_bottom_heading = header_right_bottom_heading;
        
        if (header_left_enable !== undefined) config.header_left_enable = header_left_enable === 'true';
        if (header_center_enable !== undefined) config.header_center_enable = header_center_enable === 'true';
        if (header_right_enable !== undefined) config.header_right_enable = header_right_enable === 'true';
        if (header_right_bottom_enable !== undefined) config.header_right_bottom_enable = header_right_bottom_enable === 'true';

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
            if (req.files.header_left_logo && req.files.header_left_logo[0]) {
                config.header_left_logo = `/uploads/certificate/${req.files.header_left_logo[0].filename}`;
            }
            if (req.files.header_center_logo && req.files.header_center_logo[0]) {
                config.header_center_logo = `/uploads/certificate/${req.files.header_center_logo[0].filename}`;
            }
            if (req.files.header_right_logo && req.files.header_right_logo[0]) {
                config.header_right_logo = `/uploads/certificate/${req.files.header_right_logo[0].filename}`;
            }
            if (req.files.header_right_bottom_logo && req.files.header_right_bottom_logo[0]) {
                config.header_right_bottom_logo = `/uploads/certificate/${req.files.header_right_bottom_logo[0].filename}`;
            }
            if (req.files.certificate_title_image && req.files.certificate_title_image[0]) {
                config.certificate_title_image = `/uploads/certificate/${req.files.certificate_title_image[0].filename}`;
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
