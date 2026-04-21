const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'BookAStand.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const anchor = '</div>\n                                                                    <div className="text-right">';
// Wait, I'll use a better anchor. The summary box.

const summaryBoxEnd = '</div>\n                                                                    <div className="flex justify-between items-center">';
const balanceHTML = `
                                                                    {formData.participation.total - formData.amountPaid > 0 && (
                                                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10 opacity-70">
                                                                            <p className="text-[9px] font-bold text-white/50 uppercase">Balance Remaining</p>
                                                                            <p className="text-[12px] font-bold">{formData.participation.currency === 'INR' ? '₹' : '$'} {fmtAmt(formData.participation.total - formData.amountPaid)}</p>
                                                                        </div>
                                                                    )}`;

// I'll search for line 1491 (around there)
const target = '<p className="text-2xl font-black">{formData.participation.currency === \'INR\' ? \'₹\' : \'$\'} {fmtAmt(formData.amountPaid)}</p>\n                                                                    </div>';

if (content.includes(target)) {
    content = content.replace(target, target + balanceHTML);
    fs.writeFileSync(filePath, content);
    console.log('Balance display added to summary.');
} else {
    console.log('Target for balance display not found.');
}
