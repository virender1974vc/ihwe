const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    icon: { type: String, required: true },
    end: { type: Number, required: true },
    suffix: { type: String, default: '+' },
    label: { type: String, required: true },
    bg: { type: String, required: true },
    altText: { type: String, default: '' },
    overlay: { type: Number, default: 0.4 },
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Counter', CounterSchema);
