const CertificateRecipient = require('../models/CertificateRecipient');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');

exports.getRecipients = async (req, res) => {
    try {
        const type = req.query.type || 'exhibitor';
        
        // Fetch manual recipients
        const manualRecipients = await CertificateRecipient.find({ type }).sort({ createdAt: -1 });
        
        let allRecipients = manualRecipients.map(r => ({
            _id: r._id,
            name: r.name,
            company: r.company,
            type: r.type,
            isManual: true
        }));

        if (type === 'exhibitor') {
            // Fetch registered exhibitors
            const exhibitors = await ExhibitorRegistration.find({
                status: { $in: ['approved', 'paid', 'advance-paid', 'confirmed'] }
            }).sort({ createdAt: -1 });
            
            const exhibitorRecipients = exhibitors.map(e => ({
                _id: e._id,
                name: e.fasciaName || e.exhibitorName,
                company: e.exhibitorName,
                type: 'exhibitor',
                isManual: false
            }));
            
            allRecipients = [...allRecipients, ...exhibitorRecipients];
        }

        res.status(200).json({ success: true, data: allRecipients });
    } catch (error) {
        console.error('Error fetching certificate recipients:', error);
        res.status(500).json({ success: false, message: 'Server error fetching recipients' });
    }
};

exports.addRecipient = async (req, res) => {
    try {
        const { name, type, company } = req.body;
        if (!name || !type) {
            return res.status(400).json({ success: false, message: 'Name and type are required' });
        }
        
        const newRecipient = new CertificateRecipient({
            name,
            type,
            company,
            isManual: true
        });
        
        await newRecipient.save();
        res.status(201).json({ success: true, data: newRecipient });
    } catch (error) {
        console.error('Error adding certificate recipient:', error);
        res.status(500).json({ success: false, message: 'Server error adding recipient' });
    }
};

exports.deleteRecipient = async (req, res) => {
    try {
        const { id } = req.params;
        await CertificateRecipient.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Recipient deleted successfully' });
    } catch (error) {
        console.error('Error deleting certificate recipient:', error);
        res.status(500).json({ success: false, message: 'Server error deleting recipient' });
    }
};
