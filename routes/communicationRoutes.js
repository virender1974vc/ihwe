const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Conversation = require('../models/CommunicationConversation');
const Message = require('../models/CommunicationMessage');
const Audit = require('../models/CommunicationAudit');
const Presence = require('../models/CommunicationPresence');
const Task = require('../models/CommunicationTask');
const Call = require('../models/CommunicationCall');
const Asset = require('../models/CommunicationAsset');
const communicationAi = require('../services/communicationAiService');
const { expireStaleCalls } = require('../services/communicationCallService');
const { getEventContext } = require('../services/attendanceService');

const router = express.Router();
router.use(authMiddleware);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = /^(image\/|video\/|audio\/|application\/pdf$|application\/msword$|application\/vnd\.openxmlformats-officedocument|application\/vnd\.ms-excel|text\/plain$)/i;
        cb(allowed.test(file.mimetype) ? null : new Error('Unsupported file type.'), allowed.test(file.mimetype));
    }
});

const asyncRoute = handler => async (req, res, next) => {
    try { await handler(req, res, next); }
    catch (error) {
        const status = error.status || 500;
        if (status >= 500) console.error('Communication API error:', error);
        res.status(status).json({ success: false, message: error.message || 'Communication request failed.' });
    }
};
const roleKey = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isSuperAdmin = user => ['super-admin', 'super-administrator', 'ihwe-super-administrator'].includes(roleKey(user?.role));
const userId = req => String(req.user?.id || req.user?._id || '');
const auditContext = req => ({ ipAddress: req.ip || '', userAgent: String(req.headers['user-agent'] || '').slice(0, 500) });

router.use(asyncRoute(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(userId(req))) {
        return res.status(401).json({ success: false, message: 'Invalid authenticated user.' });
    }
    const user = await User.findOne({ _id: userId(req), status: 'Active' })
        .select('_id username fullName role designation profileImage status')
        .lean();
    if (!user) {
        return res.status(401).json({ success: false, message: 'User account is inactive or unavailable.' });
    }
    if (roleKey(user.role) === 'exhibitor') {
        return res.status(403).json({ success: false, message: 'Employee communication access only.' });
    }
    req.user = {
        ...req.user,
        ...user,
        id: String(user._id),
        role: user.role
    };
    next();
}));

async function currentUser(req) {
    if (!mongoose.Types.ObjectId.isValid(userId(req))) return null;
    return User.findById(userId(req)).select('_id username fullName role designation profileImage status').lean();
}
async function primarySuperAdmin() {
    const users = await User.find({ status: 'Active' }).select('_id username fullName role').lean();
    return users.find(user => isSuperAdmin(user)) || null;
}
async function canAccess(conversation, req) {
    const id = userId(req);
    return isSuperAdmin(req.user)
        ? String(conversation.superAdminId) === id
        : String(conversation.employeeId) === id;
}
async function ensureConversation(superAdminId, employeeId) {
    return Conversation.findOneAndUpdate(
        { superAdminId, employeeId },
        { $setOnInsert: { superAdminId, employeeId } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
}
function emitToUsers(req, conversation, event, payload) {
    const namespace = req.app.get('communicationIo');
    if (!namespace) return;
    const forUser = id => event === 'message:new'
        ? { ...payload, isMine: String(payload.senderId) === String(id) }
        : payload;
    namespace.to(`user:${conversation.superAdminId}`).emit(event, forUser(conversation.superAdminId));
    namespace.to(`user:${conversation.employeeId}`).emit(event, forUser(conversation.employeeId));
}
function mediaType(mime = '') {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    return 'document';
}

async function maybeSendAiReply(req, conversation, employee, question) {
    const presence = await Presence.findOne({ userId: conversation.superAdminId }).lean();
    if (!presence?.aiAssistantEnabled || !['busy', 'away', 'offline'].includes(presence.availability)) return;
    const recentMessages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: -1 }).limit(8).lean();
    const context = await getEventContext();
    const reply = await communicationAi.generateReply({
        employeeName: employee.fullName || employee.username,
        question,
        recentMessages: recentMessages.reverse(),
        event: { ...(context.event || {}), days: context.days || [] }
    });
    if (!reply?.text) return;
    const message = await Message.create({
        conversationId: conversation._id,
        senderId: conversation.superAdminId,
        senderRole: 'ai-assistant',
        senderName: 'IHWE Gemini Assistant',
        kind: 'ai',
        text: reply.text,
        aiGenerated: true,
        metadata: { escalated: reply.escalated === true, reason: reply.reason }
    });
    conversation.lastMessage = `AI Assistant: ${reply.text}`;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastSenderId = conversation.superAdminId;
    conversation.employeeUnread += 1;
    await conversation.save();
    await Audit.create({
        conversationId: conversation._id, messageId: message._id,
        actorId: conversation.superAdminId, actorName: 'IHWE Gemini Assistant',
        actorRole: 'ai-assistant', action: reply.escalated ? 'ai-escalated' : 'ai-replied',
        after: { reason: reply.reason }, ...auditContext(req)
    });
    emitToUsers(req, conversation, 'message:new', message.toObject());
}

async function ownedAttachments(req, raw) {
    const ids = (Array.isArray(raw) ? raw : [])
        .slice(0, 10)
        .map(item => item?._id)
        .filter(id => mongoose.Types.ObjectId.isValid(id));
    if (!ids.length) return [];
    const assets = await Asset.find({ _id: { $in: ids }, uploadedBy: userId(req) }).lean();
    if (assets.length !== ids.length) {
        const error = new Error('One or more attachments are invalid or do not belong to this user.');
        error.status = 403;
        throw error;
    }
    await Asset.updateMany({ _id: { $in: ids } }, { $set: { attachedAt: new Date() } });
    return assets.map(asset => ({
        url: asset.url, publicId: asset.publicId, originalName: asset.originalName,
        mimeType: asset.mimeType, mediaType: asset.mediaType, bytes: asset.bytes
    }));
}

router.get('/employees', asyncRoute(async (req, res) => {
    if (!isSuperAdmin(req.user)) return res.status(403).json({ success: false, message: 'Super Administrator access only.' });
    const users = await User.find({ status: 'Active' }).select('_id username fullName role designation department profileImage lastLogin').sort({ fullName: 1, username: 1 }).lean();
    res.json({ success: true, data: users.filter(user => !isSuperAdmin(user) && roleKey(user.role) !== 'exhibitor') });
}));

router.get('/conversations', asyncRoute(async (req, res) => {
    const me = await currentUser(req);
    if (!me) return res.status(404).json({ success: false, message: 'User account not found.' });
    if (!isSuperAdmin(me)) {
        const admin = await primarySuperAdmin();
        if (!admin) return res.json({ success: true, data: [] });
        await ensureConversation(admin._id, me._id);
    }
    const query = isSuperAdmin(me) ? { superAdminId: me._id } : { employeeId: me._id };
    const conversations = await Conversation.find(query)
        .populate('superAdminId', 'username fullName role designation profileImage lastLogin')
        .populate('employeeId', 'username fullName role designation department profileImage lastLogin')
        .sort({ isPinnedBySuperAdmin: -1, lastMessageAt: -1, updatedAt: -1 })
        .lean();
    res.json({ success: true, data: conversations });
}));

router.post('/conversations/:employeeId', asyncRoute(async (req, res) => {
    if (!isSuperAdmin(req.user)) return res.status(403).json({ success: false, message: 'Super Administrator access only.' });
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) return res.status(400).json({ success: false, message: 'Invalid employee ID.' });
    const employee = await User.findById(req.params.employeeId).select('_id role status').lean();
    if (!employee || isSuperAdmin(employee) || roleKey(employee.role) === 'exhibitor') return res.status(404).json({ success: false, message: 'Employee not found.' });
    const conversation = await ensureConversation(userId(req), employee._id);
    res.json({ success: true, data: conversation });
}));

router.get('/conversations/:id/messages', asyncRoute(async (req, res) => {
    const conversation = await Conversation.findById(req.params.id).lean();
    if (!conversation || !(await canAccess(conversation, req))) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 50));
    const before = req.query.before ? new Date(req.query.before) : null;
    const query = { conversationId: conversation._id, ...(before && !Number.isNaN(before.getTime()) ? { createdAt: { $lt: before } } : {}) };
    const messages = await Message.find(query).select('-deletedText').sort({ createdAt: -1 }).limit(limit).lean();
    const now = new Date();
    const deliveredIds = messages
        .filter(message => String(message.senderId) !== userId(req) && !message.deliveredAt)
        .map(message => message._id);
    if (deliveredIds.length) {
        await Message.updateMany(
            { _id: { $in: deliveredIds }, deliveredAt: null },
            { $set: { deliveredAt: now } }
        );
        for (const message of messages) {
            if (deliveredIds.some(id => String(id) === String(message._id))) message.deliveredAt = now;
        }
        emitToUsers(req, conversation, 'message:delivered', {
            conversationId: conversation._id,
            messageIds: deliveredIds,
            recipientId: userId(req),
            deliveredAt: now
        });
    }
    res.json({
        success: true, data: messages.reverse().map(message => ({
            ...message, isMine: String(message.senderId) === userId(req)
        }))
    });
}));

router.post('/conversations/:id/messages', asyncRoute(async (req, res) => {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !(await canAccess(conversation, req))) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    const me = await currentUser(req);
    const text = String(req.body.text || '').trim();
    const attachments = await ownedAttachments(req, req.body.attachments);
    if (!text && !attachments.length) return res.status(400).json({ success: false, message: 'Message or attachment is required.' });
    const message = await Message.create({
        conversationId: conversation._id, senderId: me._id, senderRole: me.role,
        senderName: me.fullName || me.username, kind: attachments.length ? 'media' : 'text',
        text, attachments, replyTo: mongoose.Types.ObjectId.isValid(req.body.replyTo) ? req.body.replyTo : null
    });
    const sentByAdmin = isSuperAdmin(me);
    conversation.lastMessage = text || `${attachments.length} attachment${attachments.length === 1 ? '' : 's'}`;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastSenderId = me._id;
    if (sentByAdmin) conversation.employeeUnread += 1;
    else conversation.superAdminUnread += 1;
    await conversation.save();
    await Audit.create({ conversationId: conversation._id, messageId: message._id, actorId: me._id, actorName: me.fullName || me.username, actorRole: me.role, action: 'message-sent', after: { kind: message.kind, attachmentCount: attachments.length }, ...auditContext(req) });
    emitToUsers(req, conversation, 'message:new', message.toObject());
    res.status(201).json({ success: true, data: { ...message.toObject(), isMine: true } });
    if (!sentByAdmin && text) {
        maybeSendAiReply(req, conversation, me, text)
            .catch(error => console.error('Communication AI reply failed:', error.message));
    }
}));

router.post('/attachments', upload.single('file'), asyncRoute(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required.' });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(503).json({ success: false, message: 'Secure media storage is not configured.' });
    }
    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'ihwe-attendance/communications', resource_type: 'auto', use_filename: true, unique_filename: true },
            (error, uploaded) => error ? reject(error) : resolve(uploaded)
        );
        stream.end(req.file.buffer);
    });
    const asset = await Asset.create({
        uploadedBy: userId(req), url: result.secure_url, publicId: result.public_id,
        originalName: req.file.originalname, mimeType: req.file.mimetype,
        mediaType: mediaType(req.file.mimetype), bytes: req.file.size
    });
    res.status(201).json({
        success: true, data: {
            _id: asset._id,
            url: result.secure_url, publicId: result.public_id, originalName: req.file.originalname,
            mimeType: req.file.mimetype, mediaType: mediaType(req.file.mimetype), bytes: req.file.size
        }
    });
}));

router.patch('/conversations/:id/read', asyncRoute(async (req, res) => {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !(await canAccess(conversation, req))) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    const me = await currentUser(req);
    const unreadQuery = { conversationId: conversation._id, senderId: { $ne: me._id }, readAt: null };
    const now = new Date();
    await Message.updateMany(unreadQuery, { $set: { readAt: now, deliveredAt: now } });
    if (isSuperAdmin(me)) conversation.superAdminUnread = 0;
    else conversation.employeeUnread = 0;
    await conversation.save();
    emitToUsers(req, conversation, 'messages:read', { conversationId: conversation._id, readerId: me._id, readAt: now });
    res.json({ success: true, data: { readAt: now } });
}));

router.patch('/messages/:id', asyncRoute(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message || String(message.senderId) !== userId(req) || message.deletedAt) {
        return res.status(404).json({ success: false, message: 'Editable message not found.' });
    }
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !(await canAccess(conversation, req))) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    const text = String(req.body.text || '').trim();
    if (!text && !message.attachments.length) return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    const before = message.toObject();
    message.text = text;
    message.editedAt = new Date();
    await message.save();
    const me = await currentUser(req);
    await Audit.create({ conversationId: conversation._id, messageId: message._id, actorId: me._id, actorName: me.fullName || me.username, actorRole: me.role, action: 'message-edited', before: { text: before.text }, after: { text }, ...auditContext(req) });
    emitToUsers(req, conversation, 'message:updated', { ...message.toObject(), deletedText: undefined });
    res.json({ success: true, data: { ...message.toObject(), deletedText: undefined, isMine: true } });
}));

router.delete('/messages/:id', asyncRoute(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message || String(message.senderId) !== userId(req) || message.deletedAt) {
        return res.status(404).json({ success: false, message: 'Deletable message not found.' });
    }
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !(await canAccess(conversation, req))) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    const before = message.toObject();
    message.deletedText = message.text;
    message.text = 'This message was deleted';
    message.attachments = [];
    message.deletedAt = new Date();
    await message.save();
    const me = await currentUser(req);
    await Audit.create({ conversationId: conversation._id, messageId: message._id, actorId: me._id, actorName: me.fullName || me.username, actorRole: me.role, action: 'message-deleted', before: { text: before.text, attachments: before.attachments }, after: { deletedAt: message.deletedAt }, ...auditContext(req) });
    emitToUsers(req, conversation, 'message:updated', { ...message.toObject(), deletedText: undefined });
    res.json({ success: true, data: { ...message.toObject(), deletedText: undefined, isMine: true } });
}));

router.patch('/conversations/:id/pin', asyncRoute(async (req, res) => {
    if (!isSuperAdmin(req.user)) return res.status(403).json({ success: false, message: 'Super Administrator access only.' });
    const conversation = await Conversation.findOneAndUpdate(
        { _id: req.params.id, superAdminId: userId(req) },
        { $set: { isPinnedBySuperAdmin: req.body.pinned === true } },
        { returnDocument: 'after' }
    );
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    res.json({ success: true, data: conversation });
}));

router.get('/conversations/:id/audit', asyncRoute(async (req, res) => {
    if (!isSuperAdmin(req.user)) return res.status(403).json({ success: false, message: 'Super Administrator access only.' });
    const conversation = await Conversation.findOne({ _id: req.params.id, superAdminId: userId(req) }).lean();
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    const rows = await Audit.find({ conversationId: conversation._id }).sort({ createdAt: -1 }).limit(500).lean();
    res.json({ success: true, data: rows });
}));

router.get('/availability', asyncRoute(async (req, res) => {
    const me = await currentUser(req);
    const admin = isSuperAdmin(me) ? me : await primarySuperAdmin();
    if (!admin) return res.json({ success: true, data: { availability: 'offline', aiAssistantEnabled: false } });
    const presence = await Presence.findOneAndUpdate(
        { userId: admin._id },
        { $setOnInsert: { userId: admin._id } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    ).lean();
    res.json({ success: true, data: { ...presence, user: admin } });
}));

router.patch('/availability', asyncRoute(async (req, res) => {
    if (!isSuperAdmin(req.user)) return res.status(403).json({ success: false, message: 'Super Administrator access only.' });
    const availability = String(req.body.availability || '');
    if (!['available', 'busy', 'away', 'offline'].includes(availability)) {
        return res.status(400).json({ success: false, message: 'Invalid availability mode.' });
    }
    const presence = await Presence.findOneAndUpdate(
        { userId: userId(req) },
        {
            $set: {
                availability,
                aiAssistantEnabled: req.body.aiAssistantEnabled === true,
                statusMessage: String(req.body.statusMessage || '').trim().slice(0, 250),
                lastSeenAt: new Date()
            }
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    ).lean();
    req.app.get('communicationIo')?.emit('availability:changed', presence);
    res.json({ success: true, data: presence });
}));

router.get('/tasks', asyncRoute(async (req, res) => {
    const query = isSuperAdmin(req.user)
        ? { assignedBy: userId(req) }
        : { assignedTo: userId(req) };
    if (req.query.status) query.status = req.query.status;
    const tasks = await Task.find(query)
        .populate('assignedBy', 'username fullName profileImage')
        .populate('assignedTo', 'username fullName designation profileImage')
        .sort({ status: 1, priority: -1, createdAt: -1 })
        .limit(500)
        .lean();
    res.json({ success: true, data: tasks });
}));

router.post('/tasks', asyncRoute(async (req, res) => {
    if (!isSuperAdmin(req.user)) return res.status(403).json({ success: false, message: 'Super Administrator access only.' });
    const employeeId = String(req.body.employeeId || '');
    const title = String(req.body.title || '').trim();
    if (!mongoose.Types.ObjectId.isValid(employeeId) || !title) {
        return res.status(400).json({ success: false, message: 'Employee and task title are required.' });
    }
    const employee = await User.findById(employeeId).select('_id username fullName role').lean();
    if (!employee || isSuperAdmin(employee)) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const conversation = await ensureConversation(userId(req), employee._id);
    const dueAt = req.body.dueAt ? new Date(req.body.dueAt) : null;
    const priority = ['normal', 'high', 'urgent'].includes(req.body.priority) ? req.body.priority : 'normal';
    const task = await Task.create({
        conversationId: conversation._id, assignedBy: userId(req), assignedTo: employee._id,
        title, description: String(req.body.description || '').trim().slice(0, 5000),
        priority, dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
        statusHistory: [{ status: 'assigned', at: new Date(), by: userId(req) }]
    });
    const admin = await currentUser(req);
    const message = await Message.create({
        conversationId: conversation._id, senderId: admin._id, senderRole: admin.role,
        senderName: admin.fullName || admin.username, kind: 'task',
        text: `Task assigned: ${title}`, metadata: { taskId: task._id, priority, status: 'assigned' }
    });
    conversation.lastMessage = message.text;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastSenderId = admin._id;
    conversation.employeeUnread += 1;
    await conversation.save();
    await Audit.create({ conversationId: conversation._id, messageId: message._id, actorId: admin._id, actorName: admin.fullName || admin.username, actorRole: admin.role, action: 'task-assigned', after: task.toObject(), ...auditContext(req) });
    emitToUsers(req, conversation, 'message:new', message.toObject());
    emitToUsers(req, conversation, 'task:updated', task.toObject());
    res.status(201).json({ success: true, data: task });
}));

router.patch('/tasks/:id/status', asyncRoute(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    const me = await currentUser(req);
    const admin = isSuperAdmin(me);
    if ((!admin && String(task.assignedTo) !== String(me._id)) || (admin && String(task.assignedBy) !== String(me._id))) {
        return res.status(403).json({ success: false, message: 'Task access denied.' });
    }
    const status = String(req.body.status || '');
    const allowed = admin ? ['assigned', 'cancelled', 'completed'] : ['accepted', 'in-progress', 'completed'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid task status transition.' });
    if (!admin && status === 'completed'
        && (!Array.isArray(req.body.proofAttachments) || !req.body.proofAttachments.length)) {
        return res.status(400).json({ success: false, message: 'At least one proof photo or document is required to complete the task.' });
    }
    const before = task.toObject();
    task.status = status;
    if (status === 'completed') task.completedAt = new Date();
    if (Array.isArray(req.body.proofAttachments) && req.body.proofAttachments.length) {
        task.proofAttachments = await ownedAttachments(req, req.body.proofAttachments);
    }
    task.statusHistory.push({ status, at: new Date(), by: me._id, reason: String(req.body.reason || '').slice(0, 500) });
    await task.save();
    const conversation = await Conversation.findById(task.conversationId);
    const message = await Message.create({
        conversationId: task.conversationId, senderId: me._id, senderRole: me.role,
        senderName: me.fullName || me.username, kind: 'task',
        text: `Task "${task.title}" is now ${status.replace('-', ' ')}`,
        metadata: { taskId: task._id, status }
    });
    conversation.lastMessage = message.text;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastSenderId = me._id;
    if (admin) conversation.employeeUnread += 1; else conversation.superAdminUnread += 1;
    await conversation.save();
    await Audit.create({ conversationId: conversation._id, messageId: message._id, actorId: me._id, actorName: me.fullName || me.username, actorRole: me.role, action: 'task-status-changed', before, after: task.toObject(), ...auditContext(req) });
    emitToUsers(req, conversation, 'message:new', message.toObject());
    emitToUsers(req, conversation, 'task:updated', task.toObject());
    res.json({ success: true, data: task });
}));

router.post('/announcements', asyncRoute(async (req, res) => {
    if (!isSuperAdmin(req.user)) return res.status(403).json({ success: false, message: 'Super Administrator access only.' });
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ success: false, message: 'Announcement text is required.' });
    const admin = await currentUser(req);
    const employees = await User.find({ status: 'Active' }).select('_id role').lean();
    let sent = 0;
    for (const employee of employees.filter(item => !isSuperAdmin(item) && roleKey(item.role) !== 'exhibitor')) {
        const conversation = await ensureConversation(admin._id, employee._id);
        const message = await Message.create({
            conversationId: conversation._id, senderId: admin._id, senderRole: admin.role,
            senderName: admin.fullName || admin.username, kind: 'system',
            text, metadata: { announcement: true }
        });
        conversation.lastMessage = `Announcement: ${text}`;
        conversation.lastMessageAt = message.createdAt;
        conversation.lastSenderId = admin._id;
        conversation.employeeUnread += 1;
        await conversation.save();
        emitToUsers(req, conversation, 'message:new', message.toObject());
        sent += 1;
    }
    await Audit.create({ actorId: admin._id, actorName: admin.fullName || admin.username, actorRole: admin.role, action: 'announcement-sent', after: { sent, text }, ...auditContext(req) });
    res.status(201).json({ success: true, data: { sent } });
}));

router.get('/analytics', asyncRoute(async (req, res) => {
    if (!isSuperAdmin(req.user)) return res.status(403).json({ success: false, message: 'Super Administrator access only.' });
    const conversations = await Conversation.find({ superAdminId: userId(req) }).lean();
    const ids = conversations.map(item => item._id);
    const [messageCounts, taskCounts, aiCount] = await Promise.all([
        Message.aggregate([{ $match: { conversationId: { $in: ids } } }, { $group: { _id: '$senderRole', count: { $sum: 1 } } }]),
        Task.aggregate([{ $match: { assignedBy: new mongoose.Types.ObjectId(userId(req)) } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        Message.countDocuments({ conversationId: { $in: ids }, aiGenerated: true })
    ]);
    res.json({
        success: true, data: {
            conversations: conversations.length,
            unread: conversations.reduce((sum, item) => sum + item.superAdminUnread, 0),
            messagesByRole: Object.fromEntries(messageCounts.map(item => [item._id, item.count])),
            tasksByStatus: Object.fromEntries(taskCounts.map(item => [item._id, item.count])),
            aiReplies: aiCount
        }
    });
}));

router.get('/calls/ice-config', asyncRoute(async (_req, res) => {
    const iceServers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
    if (process.env.WEBRTC_TURN_URL && process.env.WEBRTC_TURN_USERNAME && process.env.WEBRTC_TURN_CREDENTIAL) {
        iceServers.push({
            urls: process.env.WEBRTC_TURN_URL.split(',').map(item => item.trim()).filter(Boolean),
            username: process.env.WEBRTC_TURN_USERNAME,
            credential: process.env.WEBRTC_TURN_CREDENTIAL
        });
    }
    res.json({
        success: true, data: {
            iceServers,
            turnConfigured: iceServers.length > 1,
            warning: iceServers.length > 1 ? '' : 'TURN is not configured; calls may fail across restrictive mobile networks.'
        }
    });
}));

router.get('/calls', asyncRoute(async (req, res) => {
    await expireStaleCalls(req.app.get('communicationIo'));
    const id = new mongoose.Types.ObjectId(userId(req));
    const calls = await Call.find({ $or: [{ callerId: id }, { calleeId: id }] })
        .populate('callerId', 'username fullName profileImage')
        .populate('calleeId', 'username fullName profileImage')
        .sort({ createdAt: -1 }).limit(200).lean();
    res.json({
        success: true, data: calls.map(call => ({
            ...call, isCaller: String(call.callerId?._id || call.callerId) === userId(req)
        }))
    });
}));

router.post('/calls', asyncRoute(async (req, res) => {
    const conversation = await Conversation.findById(req.body.conversationId);
    if (!conversation || !(await canAccess(conversation, req))) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    await expireStaleCalls(req.app.get('communicationIo'));
    const type = req.body.type === 'video' ? 'video' : 'audio';
    const callerId = userId(req);
    const calleeId = String(conversation.superAdminId) === callerId ? conversation.employeeId : conversation.superAdminId;
    const participants = [new mongoose.Types.ObjectId(callerId), new mongoose.Types.ObjectId(calleeId)];
    const activeCall = await Call.findOne({
        status: { $in: ['ringing', 'accepted'] },
        $or: [
            { callerId: { $in: participants } },
            { calleeId: { $in: participants } }
        ]
    }).lean();
    if (activeCall) {
        return res.status(409).json({
            success: false,
            message: 'One of the participants is already in another call.',
            code: 'PARTICIPANT_BUSY'
        });
    }
    const caller = await currentUser(req);
    const call = await Call.create({ conversationId: conversation._id, callerId, calleeId, type });
    const payload = {
        ...call.toObject(), callerName: caller.fullName || caller.username,
        callerImage: caller.profileImage || ''
    };
    req.app.get('communicationIo')?.to(`user:${calleeId}`).emit('call:incoming', payload);
    await Audit.create({ conversationId: conversation._id, actorId: caller._id, actorName: caller.fullName || caller.username, actorRole: caller.role, action: 'call-started', after: { callId: call._id, type }, ...auditContext(req) });
    res.status(201).json({ success: true, data: { ...call.toObject(), isCaller: true } });
}));

router.patch('/calls/:id', asyncRoute(async (req, res) => {
    const call = await Call.findById(req.params.id);
    if (!call || ![String(call.callerId), String(call.calleeId)].includes(userId(req))) {
        return res.status(404).json({ success: false, message: 'Call not found.' });
    }
    const action = String(req.body.action || '');
    const now = new Date();
    const isCaller = String(call.callerId) === userId(req);
    const isCallee = String(call.calleeId) === userId(req);
    if (action === 'accept' && isCallee && call.status === 'ringing') {
        call.status = 'accepted';
        call.answeredAt = now;
    } else if (action === 'reject' && isCallee && call.status === 'ringing') {
        call.status = 'rejected';
        call.endedAt = now;
        call.endedBy = userId(req);
        call.endReason = 'rejected';
    } else if (action === 'end' && ['ringing', 'accepted'].includes(call.status)) {
        call.status = 'ended';
        call.endedAt = now;
        call.endedBy = userId(req);
        call.endReason = String(req.body.reason || 'ended').slice(0, 100);
        if (call.answeredAt) call.durationSeconds = Math.max(0, Math.round((now - call.answeredAt) / 1000));
    } else {
        return res.status(409).json({ success: false, message: 'Call is no longer in that state.' });
    }
    await call.save();
    const namespace = req.app.get('communicationIo');
    const event = action === 'accept' ? 'call:accepted' : 'call:ended';
    namespace?.to(`user:${call.callerId}`).emit(event, call.toObject());
    namespace?.to(`user:${call.calleeId}`).emit(event, call.toObject());
    res.json({ success: true, data: call });
}));

module.exports = router;
