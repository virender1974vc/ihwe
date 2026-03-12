const mongoose = require('mongoose');

const marqueeSchema = new mongoose.Schema({
    text: {
        type: String,
        default: "Connecting Global Healthcare Innovators  •  Medical Technology  •  Wellness Solutions  •  Diagnostics  •  Pharma  •  Innovation  •  AI in Healthcare  •  "
    },
    bgColor: {
        type: String,
        default: "#23471d"
    }
}, { timestamps: true });

module.exports = mongoose.model('Marquee', marqueeSchema);
