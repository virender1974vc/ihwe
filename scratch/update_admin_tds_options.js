const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update TDS Options in UI
const oldTdsUI = `{[0, 2].map((val) => (`;
const newTdsUI = `{[0, 1, 2, 10].map((val) => (`;
content = content.replace(oldTdsUI, newTdsUI);

// 2. Update Calculation Logic in useEffect
const calcEffectStart = '// Total Calculation';
const calcEffectEnd = '}, [formData.participation.stallNo, formData.participation.rate, availableStalls, formData.paymentPlanType, formData.chosenTdsPercent]);';

const updatedCalcEffect = `// Total Calculation
    useEffect(() => {
        const part = formData.participation;
        const stall = availableStalls.find(s => s._id === part.stallNo);
        const area = stall ? stall.area : 0;
        const rate = Number(part.rate) || 0;
        const inc = stall ? stall.incrementPercentage : 0;
        const disc = stall ? stall.discountPercentage : 0;

        const baseAmount = (area * rate) + ((area * rate) * inc / 100);
        const discountAmount = baseAmount * (disc / 100);
        const subtotal = baseAmount - discountAmount;
        
        const tdsP = formData.chosenTdsPercent || 0;
        const tdsA = Math.round(subtotal * (tdsP / 100));
        
        const gst = subtotal * 0.18;
        const totalWithGst = subtotal + gst;
        const netPayableTotal = totalWithGst - tdsA;

        const currentEvent = events.find(e => e._id === selectedEventId);
        const selectedPlan = (currentEvent?.paymentPlans || []).find(p => p.id === formData.paymentPlanType);
        
        // Installments are calculated on the Net Payable (total - tds)
        let paid = netPayableTotal; 
        if (selectedPlan) {
            paid = Math.round(netPayableTotal * (Number(selectedPlan.percentage) / 100));
        }

        setFormData(prev => ({
            ...prev,
            participation: { 
                ...prev.participation, 
                stallSize: area, 
                amount: Math.round(subtotal), 
                total: Math.round(totalWithGst) 
            },
            financeBreakdown: {
                grossAmount: Math.round(subtotal),
                discountPercent: disc,
                discountAmount: Math.round(discountAmount),
                subtotal: Math.round(subtotal),
                tdsAmount: tdsA,
                netPayable: Math.round(netPayableTotal)
            },
            amountPaid: paid,
            balanceAmount: Math.round(netPayableTotal - paid)
        }));
    }, [formData.participation.stallNo, formData.participation.rate, availableStalls, formData.paymentPlanType, formData.chosenTdsPercent]);`;

if (content.indexOf(calcEffectStart) !== -1) {
    const part1 = content.split(calcEffectStart)[0];
    const rest = content.split(calcEffectStart)[1].split(calcEffectEnd)[1];
    content = part1 + updatedCalcEffect + rest;
    fs.writeFileSync(filePath, content);
    console.log('BookAStand.jsx TDS Options & Logic Updated.');
}
