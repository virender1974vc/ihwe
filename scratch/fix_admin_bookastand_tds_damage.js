const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix formData
const formDataFix = `primaryCategory: '',
        subCategory: '',
        referredBy: 'Direct Website',
        spokenWith: '',
        filledBy: 'Admin',
        status: 'pending',
        paymentMode: 'manual',
        paymentPlanType: 'full', paymentPlanLabel: 'Full Payment (100%)',
        chosenTdsPercent: 0,
        amountPaid: 0,
        balanceAmount: 0,
        financeBreakdown: {
            grossAmount: 0,
            discountPercent: 0,
            discountAmount: 0,
            subtotal: 0,
            tdsAmount: 0,
            netPayable: 0
        }
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const eRes = await api.get('/api/events');`;

const brokenformData = /primaryCategory: '',\s+const staffRes = await api\.get\('\/api\/public\/employees'\);/;

if (brokenformData.test(content)) {
    content = content.replace(brokenformData, formDataFix + "\n                const staffRes = await api.get('/api/public/employees');");
    fs.writeFileSync(filePath, content);
    console.log('BookAStand.jsx State & Fetch Fixed.');
} else {
    console.log('Broken sequence not found.');
}
