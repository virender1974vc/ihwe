const TravelAccommodation = require("../models/TravelAccommodation");

const getTravelAccommodation = async (req, res) => {
    try {
        let data = await TravelAccommodation.findOne();
        if (!data) {
            // Seed default data if not exists
            data = await TravelAccommodation.create({
                venueHeading: "Venue Location",
                mapIframe: '<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
                commuteOptions: [
                    { icon: 'Car', title: 'By Road', description: 'Easily accessible by car, taxi, or bus. The venue is well-connected to major highways.' },
                    { icon: 'Train', title: 'By Train', description: 'Nearest Railway Station: New Delhi Railway Station (Approx 5 km).' }
                ],
                hotelOptions: [
                    { image: 'radisson_blu.jpg', title: 'Radisson Blu', tag: 'Most Popular', distance: '3 km from venue', rate: '₹12,500/night', stars: 5 }
                ]
            });
        }
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateHeadings = async (req, res) => {
    try {
        const update = await TravelAccommodation.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json({ success: true, data: update });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addHotel = async (req, res) => {
    try {
        const data = await TravelAccommodation.findOne();
        data.hotelOptions.push(req.body);
        await data.save();
        res.json({ success: true, data: data.hotelOptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteHotel = async (req, res) => {
    try {
        const data = await TravelAccommodation.findOne();
        data.hotelOptions = data.hotelOptions.filter(h => h._id.toString() !== req.params.id);
        await data.save();
        res.json({ success: true, data: data.hotelOptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addCommute = async (req, res) => {
    try {
        const data = await TravelAccommodation.findOne();
        data.commuteOptions.push(req.body);
        await data.save();
        res.json({ success: true, data: data.commuteOptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteCommute = async (req, res) => {
    try {
        const data = await TravelAccommodation.findOne();
        data.commuteOptions = data.commuteOptions.filter(c => c._id.toString() !== req.params.id);
        await data.save();
        res.json({ success: true, data: data.commuteOptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const uploadImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        const imageUrl = `/uploads/travel-accommodation/${req.file.filename}`;
        res.json({ success: true, url: imageUrl, message: 'Image uploaded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateHotel = async (req, res) => {
    try {
        const data = await TravelAccommodation.findOne();
        const index = data.hotelOptions.findIndex(h => h._id.toString() === req.params.id);
        if (index === -1) return res.status(404).json({ success: false, message: 'Hotel not found' });
        data.hotelOptions[index] = { ...data.hotelOptions[index].toObject(), ...req.body };
        await data.save();
        res.json({ success: true, data: data.hotelOptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateCommute = async (req, res) => {
    try {
        const data = await TravelAccommodation.findOne();
        const index = data.commuteOptions.findIndex(c => c._id.toString() === req.params.id);
        if (index === -1) return res.status(404).json({ success: false, message: 'Option not found' });
        data.commuteOptions[index] = { ...data.commuteOptions[index].toObject(), ...req.body };
        await data.save();
        res.json({ success: true, data: data.commuteOptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getTravelAccommodation,
    updateHeadings,
    addHotel,
    updateHotel,
    deleteHotel,
    addCommute,
    updateCommute,
    deleteCommute,
    uploadImage
};
