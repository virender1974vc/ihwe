const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'BookAStand.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Part 1: upto line 392 (end of paid calculation)
const part1 = lines.slice(0, 392);

// Part 2: Fixed setFormData and closing of effect
const part2 = [
'        ',
'        setFormData(prev => ({',
'            ...prev,',
'            participation: {',
'                ...prev.participation,',
'                amount: Math.round(subtotal),',
'                discount: Math.round(discountAmount + fullDiscA),',
'                total: totalWithGst',
'            },',
'            financeBreakdown: {',
'                grossAmount: Math.round(subtotal),',
'                discountPercent: fullDiscP,',
'                discountAmount: fullDiscA,',
'                subtotal: subAfterDisc,',
'                tdsAmount: tdsA,',
'                netPayable: netBase + gst',
'            },',
'            amountPaid: paid,',
'            balanceAmount: totalWithGst - paid',
'        }));',
'    }, [formData.participation.rate, formData.participation.stallSize, formData.participation.stallNo, formData.paymentPlanType, formData.chosenTdsPercent, settings, events, selectedEventId]);',
'',
'    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {',
'        const { name, value } = e.target;'
];

// Part 3: From line 394 (stray code starts) find where to resume
// The stray code ends at line 435 with "};" then "const handleSelectChange"
// I'll skip the corrupted part and find "const handleSelectChange"
let selectChangeStart = -1;
for(let i = 400; i < lines.length; i++) {
    if (lines[i].includes('const handleSelectChange')) {
        selectChangeStart = i;
        break;
    }
}

const part3 = lines.slice(selectChangeStart);

const final = part1.concat(part2).concat(part3).join('\n');
fs.writeFileSync(filePath, final);
console.log("Deep Surgical Repair Complete.");
