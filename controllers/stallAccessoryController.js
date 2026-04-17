const StallAccessory = require('../models/StallAccessory');
const AccessoryOrder = require('../models/AccessoryOrder');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');

// ─── STALL ACCESSORIES (Admin CRUD) ──────────────────────────────────────────

const getAllAccessories = async (req, res) => {
    try {
        const items = await StallAccessory.find().sort({ type: 1, sortOrder: 1, createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const createAccessory = async (req, res) => {
    try {
        const item = new StallAccessory(req.body);
        await item.save();
        res.status(201).json({ success: true, data: item });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const updateAccessory = async (req, res) => {
    try {
        const item = await StallAccessory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: item });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const deleteAccessory = async (req, res) => {
    try {
        await StallAccessory.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── ACCESSORY ORDERS ────────────────────────────────────────────────────────

const getAllOrders = async (req, res) => {
    try {
        const { exhibitorId } = req.query;
        const filter = exhibitorId ? { exhibitorRegistrationId: exhibitorId } : {};
        const orders = await AccessoryOrder.find(filter)
            .populate('items.accessoryId', 'name type imageUrl')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await AccessoryOrder.findById(req.params.id)
            .populate('items.accessoryId');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const createOrder = async (req, res) => {
    try {
        const { exhibitorRegistrationId, items, paymentMode, transactionId, notes, processedBy } = req.body;

        const reg = await ExhibitorRegistration.findById(exhibitorRegistrationId);
        if (!reg) return res.status(404).json({ success: false, message: 'Exhibitor registration not found' });

        // Enrich items with pricing
        let subtotal = 0, totalGst = 0;
        const enrichedItems = items.map(item => {
            const unitPrice = item.unitPrice || 0;
            const qty = item.qty || 1;
            const gstPct = item.gstPercent || 0;
            const base = unitPrice * qty;
            const gst = Math.round((base * gstPct) / 100 * 100) / 100;
            const total = base + gst;
            subtotal += base;
            totalGst += gst;
            return { ...item, unitPrice, qty, gstAmount: gst, totalPrice: total };
        });

        const grandTotal = subtotal + totalGst;
        const orderNo = await AccessoryOrder.generateOrderNo();

        // Determine payment status
        const allComplimentary = enrichedItems.every(i => i.type === 'complimentary');
        const paymentStatus = allComplimentary ? 'complimentary' : (grandTotal === 0 ? 'complimentary' : 'paid');

        const order = new AccessoryOrder({
            exhibitorRegistrationId,
            registrationId: reg.registrationId,
            exhibitorName: reg.exhibitorName,
            stallNo: reg.participation?.stallFor || '',
            orderNo,
            items: enrichedItems,
            subtotal,
            totalGst,
            grandTotal,
            paymentStatus,
            paymentMode: paymentMode || '',
            transactionId: transactionId || '',
            paidAt: paymentStatus !== 'pending' ? new Date() : null,
            processedBy: processedBy || 'Admin',
            notes: notes || '',
        });

        await order.save();

        // Generate PDF receipt
        try {
            const pdfResult = await pdfGenerator.generateAccessoryReceipt(order, reg);
            if (pdfResult?.cloudUrl) {
                order.receiptUrl = pdfResult.cloudUrl;
                await order.save();
            }

            // Send email
            const email = reg.contact1?.email;
            if (email) {
                await emailService.sendAccessoryOrderEmail(reg, order, pdfResult?.filePath);
                order.emailSent = true;
                await order.save();
            }
        } catch (emailErr) {
            console.error('Accessory receipt/email error:', emailErr.message);
        }

        res.status(201).json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const updateOrder = async (req, res) => {
    try {
        const order = await AccessoryOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const deleteOrder = async (req, res) => {
    try {
        await AccessoryOrder.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getAllAccessories, createAccessory, updateAccessory, deleteAccessory,
    getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder,
};
