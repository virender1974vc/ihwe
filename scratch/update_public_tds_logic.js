const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'BookAStand.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldEffect = `        const tdsA = Math.round(subAfterDisc * (tdsP / 100));
        const netBase = subAfterDisc - tdsA;
        
        // GST Calculation (18% on the base amount after discount)
        const gst = Math.round(subAfterDisc * 0.18);
        const totalWithGst = subAfterDisc + gst;
        
        // Amount Paid logic based on Plan
        const currentEvent = events.find(e => (e as any)._id === selectedEventId);
        const selectedPlan = (currentEvent?.paymentPlans || []).find((p: any) => p.id === plan);
        
        let paid = totalWithGst; // Default for full
        if (selectedPlan) {
            paid = Math.round(totalWithGst * (Number(selectedPlan.percentage) / 100));
        }

        setFormData(prev => ({
            ...prev,
            participation: {
                ...prev.participation,
                amount: Math.round(subtotal),
                discount: Math.round(discountAmount + fullDiscA),
                total: totalWithGst
            },
            financeBreakdown: {
                grossAmount: Math.round(subtotal),
                discountPercent: fullDiscP,
                discountAmount: fullDiscA,
                subtotal: subAfterDisc,
                tdsAmount: tdsA,
                netPayable: netBase + gst // Net payable to us
            },
            amountPaid: paid,
            balanceAmount: totalWithGst - paid
        }));`;

const newEffect = `        const tdsA = Math.round(subAfterDisc * (tdsP / 100));
        const netBase = subAfterDisc - tdsA;
        
        // GST Calculation (18% on the base amount after discount)
        const gst = Math.round(subAfterDisc * 0.18);
        const totalWithGst = subAfterDisc + gst;
        const netPayableTotal = totalWithGst - tdsA;

        // Amount Paid logic based on Plan
        const currentEvent = events.find(e => (e as any)._id === selectedEventId);
        const selectedPlan = (currentEvent?.paymentPlans || []).find((p: any) => p.id === plan);
        
        let paid = netPayableTotal; // Default for full (TDS handled by user)
        if (selectedPlan) {
            paid = Math.round(netPayableTotal * (Number(selectedPlan.percentage) / 100));
        }

        setFormData(prev => ({
            ...prev,
            participation: {
                ...prev.participation,
                amount: Math.round(subtotal),
                discount: Math.round(discountAmount + fullDiscA),
                total: totalWithGst
            },
            financeBreakdown: {
                grossAmount: Math.round(subtotal),
                discountPercent: fullDiscP,
                discountAmount: fullDiscA,
                subtotal: subAfterDisc,
                tdsAmount: tdsA,
                netPayable: netPayableTotal // Actual amount we expect to receive in bank
            },
            amountPaid: paid,
            balanceAmount: Math.round(netPayableTotal - paid)
        }));`;

if (content.indexOf('const tdsA = Math.round(subAfterDisc * (tdsP / 100));') !== -1) {
    content = content.replace(oldEffect.trim(), newEffect.trim());
    fs.writeFileSync(filePath, content);
    console.log('Public BookAStand.tsx TDS logic updated.');
} else {
    console.log('Target not found in public side.');
}
