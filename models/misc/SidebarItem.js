const mongoose = require('mongoose');

const sidebarItemSchema = new mongoose.Schema({
    label: { type: String, required: true },
    type: { type: String, enum: ['heading', 'item', 'dropdown'], required: true },
    path: { type: String },
    icon: { type: String },
    order: { type: Number, default: 0 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SidebarItem', default: null },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SidebarItem' }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('SidebarItem', sidebarItemSchema);
