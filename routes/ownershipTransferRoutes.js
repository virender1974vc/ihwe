const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");
const ActivityLog = require("../models/activity/activityLogModel");
const User = require("../models/User");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ihwe_secret_2026');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token expired or invalid' });
    }
};

// GET /api/ownership-transfer/logs
router.get("/logs", verifyToken, async (req, res) => {
    try {
        const rawLogs = await ActivityLog.find({ module: "Ownership Transfer" }).sort({ createdAt: -1 }).lean();
        const logs = rawLogs.map(log => {
            let detailsObj = {};
            try {
                detailsObj = JSON.parse(log.details);
            } catch(e) {}
            return {
                _id: log._id,
                transferType: detailsObj.transferType || "Unknown",
                fromUser: detailsObj.fromUser || "",
                fromDesignation: detailsObj.fromDesignation || "",
                toUser: detailsObj.toUser || "",
                toDesignation: detailsObj.toDesignation || "",
                recordCount: detailsObj.recordCount || 0,
                reason: detailsObj.reason || "",
                status: detailsObj.status || "Completed",
                updatedBy: log.user,
                createdAt: log.createdAt
            };
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/ownership-transfer/client
router.post("/client", verifyToken, async (req, res) => {
    try {
        const { fromUser, toUser, reason } = req.body;
        
        if (!fromUser || !toUser || !reason) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        
        if (fromUser === toUser) {
            return res.status(400).json({ success: false, message: "Cannot transfer to the same user" });
        }

        // Fetch users to get designations
        const [fromUserDetails, toUserDetails] = await Promise.all([
            User.findOne({ username: fromUser }).lean(),
            User.findOne({ username: toUser }).lean()
        ]);

        if (!fromUserDetails || !toUserDetails) {
             return res.status(404).json({ success: false, message: "One or both users not found" });
        }

        const queryUsers = [fromUser];
        if (fromUserDetails.fullName) queryUsers.push(fromUserDetails.fullName);

        // Find companies to transfer (matching added_by or forwardTo)
        const companiesToTransfer = await Company.find({ 
            $or: [{ added_by: { $in: queryUsers } }, { forwardTo: { $in: queryUsers } }]
        }).lean();

        const count = companiesToTransfer.length;
        const targetOwner = toUserDetails.fullName || toUser;

        // Perform the transfer
        await Company.updateMany(
            { added_by: { $in: queryUsers } },
            { $set: { added_by: targetOwner } }
        );
        
        await Company.updateMany(
            { forwardTo: { $in: queryUsers } },
            { $set: { forwardTo: targetOwner } }
        );

        // Create log
        const detailsObj = {
            transferType: "Client Transfer",
            fromUser: fromUserDetails.fullName || fromUser,
            fromDesignation: fromUserDetails.designation || "",
            toUser: toUserDetails.fullName || toUser,
            toDesignation: toUserDetails.designation || "",
            recordCount: count,
            reason,
            status: "Completed"
        };
        const log = await ActivityLog.create({
            user: req.user.username || "Admin",
            action: "Transfer Client",
            module: "Ownership Transfer",
            details: JSON.stringify(detailsObj)
        });

        res.json({ success: true, message: `Successfully transferred ${count} clients.`, data: {
            _id: log._id,
            ...detailsObj,
            updatedBy: log.user,
            createdAt: log.createdAt
        }});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/ownership-transfer/leads
router.get("/leads", verifyToken, async (req, res) => {
    try {
        const { currentOwner, status } = req.query;
        let ownerDesignation = "";
        let ownerName = currentOwner;
        let queryUsers = [currentOwner];
        
        if (currentOwner) {
             const user = await User.findOne({ username: currentOwner }).lean();
             if (user) {
                 ownerName = user.fullName || user.username;
                 ownerDesignation = user.designation || "";
                 if (user.fullName) queryUsers.push(user.fullName);
             }
        }
        
        let query = {};
        if (currentOwner) {
             query.$or = [{ added_by: { $in: queryUsers } }, { forwardTo: { $in: queryUsers } }];
        }
        if (status) {
             query.companyStatus = status;
        }

        const leads = await Company.find(query).sort({ createdAt: -1 }).lean();
        
        const mappedLeads = leads.map(l => ({
            id: l._id,
            name: l.companyName,
            phone: (l.contacts && l.contacts.length > 0) ? l.contacts[0].mobile : (l.mobile || ""),
            status: l.companyStatus,
            currentOwner: l.forwardTo || l.added_by || "Unassigned",
            updatedBy: l.updated_by || "System",
            date: l.updatedAt
        }));

        res.json({ success: true, data: mappedLeads });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/ownership-transfer/reassign
router.post("/reassign", verifyToken, async (req, res) => {
    try {
        const { fromUser, toUser, leadStatus, remarks } = req.body;
        
        if (!fromUser || !toUser || !leadStatus) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        
        if (fromUser === toUser) {
            return res.status(400).json({ success: false, message: "Cannot reassign to the same user" });
        }

        const [fromUserDetails, toUserDetails] = await Promise.all([
            User.findOne({ username: fromUser }).lean(),
            User.findOne({ username: toUser }).lean()
        ]);

        if (!fromUserDetails || !toUserDetails) {
             return res.status(404).json({ success: false, message: "One or both users not found" });
        }

        const queryUsers = [fromUser];
        if (fromUserDetails.fullName) queryUsers.push(fromUserDetails.fullName);

        const query = { 
            companyStatus: leadStatus,
            $or: [{ added_by: { $in: queryUsers } }, { forwardTo: { $in: queryUsers } }]
        };

        const leadsToReassign = await Company.find(query).lean();
        const count = leadsToReassign.length;
        const targetOwner = toUserDetails.fullName || toUser;

        // Reassign leads
        await Company.updateMany(query, { $set: { forwardTo: targetOwner, updated_by: req.user.username } });

        // Create log
        const detailsObj = {
            transferType: "Lead Reassignment",
            fromUser: fromUserDetails.fullName || fromUser,
            fromDesignation: fromUserDetails.designation || "",
            toUser: toUserDetails.fullName || toUser,
            toDesignation: toUserDetails.designation || "",
            recordCount: count,
            reason: remarks || `Reassigned ${leadStatus} leads`,
            status: "Completed"
        };
        const log = await ActivityLog.create({
            user: req.user.username || "Admin",
            action: "Reassign Leads",
            module: "Ownership Transfer",
            details: JSON.stringify(detailsObj)
        });

        res.json({ success: true, message: `Successfully reassigned ${count} leads.`, data: {
            _id: log._id,
            ...detailsObj,
            updatedBy: log.user,
            createdAt: log.createdAt
        }});

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
