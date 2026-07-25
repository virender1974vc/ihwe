const StallAccessory = require('../models/StallAccessory');
const AccessoryOrder = require('../models/AccessoryOrder');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');
const { computeEntitlement, getExhibitorStallArea } = require('../utils/entitlementCalculator');

// ─── COMPLIMENTARY ENTITLEMENT HELPERS ───────────────────────────────────────

const getUsedComplimentaryQty = async (exhibitorRegistrationId, accessoryId) => {
    const orders = await AccessoryOrder.find({
        exhibitorRegistrationId,
        'items.accessoryId': accessoryId,
        paymentStatus: { $ne: 'failed' },
    }).select('items');
    let used = 0;
    for (const order of orders) {
        for (const item of order.items) {
            if (item.type === 'complimentary' && String(item.accessoryId) === String(accessoryId)) {
                used += Number(item.qty) || 0;
            }
        }
    }
    return used;
};

// Validates every complimentary line item against the exhibitor's stall-area-based
// entitlement, minus whatever complimentary qty they've already claimed. Throws with
// a user-facing message if any line item exceeds the remaining balance.
const assertComplimentaryWithinEntitlement = async (exhibitorRegistrationId, items) => {
    const stallArea = await getExhibitorStallArea(exhibitorRegistrationId);
    for (const item of items) {
        if (item.type !== 'complimentary' || !item.accessoryId) continue;
        const accessory = await StallAccessory.findById(item.accessoryId);
        if (!accessory) continue;
        const entitled = computeEntitlement({
            allocationMode: accessory.allocationMode,
            ratioQty: accessory.ratioQty,
            ratioArea: accessory.ratioArea,
            roundingMode: accessory.roundingMode,
            fixedQty: accessory.includedQty,
        }, stallArea);
        const used = await getUsedComplimentaryQty(exhibitorRegistrationId, item.accessoryId);
        const remaining = Math.max(0, entitled - used);
        const requestedQty = Number(item.qty) || 0;
        if (requestedQty > remaining) {
            const err = new Error(`Complimentary limit exceeded for "${accessory.name}" — only ${remaining} remaining`);
            err.status = 400;
            throw err;
        }
    }
};

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
        const data = { ...req.body };
        if (req.file) {
            data.imageUrl = `/uploads/accessories/${req.file.filename}`;
        }

        // Handle numeric/boolean fields that might come as strings from FormData
        if (data.price) data.price = Number(data.price);
        if (data.gstPercent) data.gstPercent = Number(data.gstPercent);
        if (data.includedQty) data.includedQty = Number(data.includedQty);
        if (data.availableQty) data.availableQty = Number(data.availableQty);
        if (data.sortOrder) data.sortOrder = Number(data.sortOrder);
        if (data.ratioQty !== undefined) data.ratioQty = Number(data.ratioQty);
        if (data.ratioArea !== undefined) data.ratioArea = Number(data.ratioArea);
        if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;

        const item = new StallAccessory(data);
        await item.save();
        res.status(201).json({ success: true, data: item });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const updateAccessory = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.imageUrl = `/uploads/accessories/${req.file.filename}`;
        }

        // Handle numeric/boolean fields
        if (data.price) data.price = Number(data.price);
        if (data.gstPercent) data.gstPercent = Number(data.gstPercent);
        if (data.includedQty) data.includedQty = Number(data.includedQty);
        if (data.availableQty) data.availableQty = Number(data.availableQty);
        if (data.sortOrder) data.sortOrder = Number(data.sortOrder);
        if (data.ratioQty !== undefined) data.ratioQty = Number(data.ratioQty);
        if (data.ratioArea !== undefined) data.ratioArea = Number(data.ratioArea);
        if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;

        const item = await StallAccessory.findByIdAndUpdate(req.params.id, data, { returnDocument: 'after' });
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

        await assertComplimentaryWithinEntitlement(exhibitorRegistrationId, items);

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

        // Update Stock
        try {
            for (const item of items) {
                if (item.accessoryId) {
                    await StallAccessory.findByIdAndUpdate(item.accessoryId, {
                        $inc: { availableQty: -Math.abs(Number(item.qty || 1)) }
                    });
                }
            }
        } catch (stockErr) {
            console.error('Stock update error:', stockErr.message);
        }

        // Generate PDF receipt
        try {
            const pdfResult = await pdfGenerator.generateAccessoryReceipt(order, reg);
            if (pdfResult?.cloudUrl) {
                order.receiptUrl = pdfResult.cloudUrl;
                await order.save();
            }

            // Send email/WhatsApp notification using saved exhibitor contact details.
            const sent = await emailService.sendAccessoryOrderEmail(reg, order, pdfResult?.filePath);
            order.emailSent = !!sent;
            await order.save();
            if (!sent) {
                console.error('Accessory order notification failed for order:', order.orderNo);
            }
        } catch (emailErr) {
            console.error('Accessory receipt/email error:', emailErr.message);
        }

        const io = req.app.get('io');
        if (io) {
            io.to('admin_room').emit('accessory_order_placed', {
                orderNo: order.orderNo,
                exhibitorName: order.exhibitorName,
                grandTotal: order.grandTotal,
                paymentMode: order.paymentMode,
                timestamp: Date.now()
            });
        }

        res.status(201).json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const updateOrder = async (req, res) => {
    try {
        const order = await AccessoryOrder.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
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
const getMyEntitlements = async (req, res) => {
    try {
        const exhibitorRegistrationId = req.user.id;
        const stallArea = await getExhibitorStallArea(exhibitorRegistrationId);
        const accessories = await StallAccessory.find({ isActive: true }).sort({ category: 1, sortOrder: 1 });

        const data = await Promise.all(accessories.map(async (accessory) => {
            const entitledQty = accessory.type === 'complimentary'
                ? computeEntitlement({
                    allocationMode: accessory.allocationMode,
                    ratioQty: accessory.ratioQty,
                    ratioArea: accessory.ratioArea,
                    roundingMode: accessory.roundingMode,
                    fixedQty: accessory.includedQty,
                }, stallArea)
                : 0;
            return {
                accessoryId: accessory._id,
                name: accessory.name,
                type: accessory.type,
                unit: accessory.unit,
                imageUrl: accessory.imageUrl,
                entitledQty,
                allocatedQty: entitledQty,
                allocationStatus: entitledQty > 0 ? 'included' : 'not-included',
                usedQty: 0,
                remainingQty: entitledQty,
            };
        }));

        res.json({ success: true, data, stallArea });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getAllAccessories, createAccessory, updateAccessory, deleteAccessory,
    getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder,
    getMyEntitlements, assertComplimentaryWithinEntitlement,
};
