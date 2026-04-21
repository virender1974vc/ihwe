const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

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
        const stallDiscountAmount = baseAmount * (disc / 100);
        const subtotal = baseAmount - stallDiscountAmount;
        
        // Full payment discount logic from settings
        const isFullPayment = formData.paymentPlanType === 'full';
        const fullDiscP = isFullPayment ? (settings?.fullPaymentDiscount || 5) : 0;
        const fullDiscA = Math.round(subtotal * (fullDiscP / 100));
        const subAfterFullDisc = subtotal - fullDiscA;

        const tdsP = formData.chosenTdsPercent || 0;
        const tdsA = Math.round(subAfterFullDisc * (tdsP / 100));
        
        const gst = subAfterFullDisc * 0.18;
        const totalWithGst = subAfterFullDisc + gst;
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
                discountPercent: fullDiscP,
                discountAmount: Math.round(stallDiscountAmount + fullDiscA),
                subtotal: Math.round(subAfterFullDisc),
                tdsAmount: tdsA,
                netPayable: Math.round(netPayableTotal)
            },
            amountPaid: paid,
            balanceAmount: Math.round(netPayableTotal - paid)
        }));
    }, [formData.participation.stallNo, formData.participation.rate, availableStalls, formData.paymentPlanType, formData.chosenTdsPercent, settings?.fullPaymentDiscount]);`;

if (content.indexOf(calcEffectStart) !== -1) {
    const part1 = content.split(calcEffectStart)[0];
    const rest = content.split(calcEffectStart)[1].split(calcEffectEnd)[1];
    content = part1 + updatedCalcEffect + rest;
    fs.writeFileSync(filePath, content);
    console.log('Admin Calculation with Full Payment Discount updated.');
}
