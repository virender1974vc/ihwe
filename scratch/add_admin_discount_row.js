const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = `                            <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Space Rental</p>
                                <p className="text-sm font-bold text-slate-900">{formData.participation.currency} {formData.financeBreakdown.subtotal?.toLocaleString()}</p>
                            </div>`;

const replacement = `                            <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Cost</p>
                                <p className="text-sm font-bold text-slate-900">{formData.participation.currency} {formData.financeBreakdown.grossAmount?.toLocaleString()}</p>
                            </div>
                            {formData.financeBreakdown.discountAmount > 0 && (
                                <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-4 text-blue-600">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Discount</p>
                                    <p className="text-sm font-bold">-{formData.participation.currency} {formData.financeBreakdown.discountAmount?.toLocaleString()}</p>
                                </div>
                            )}
                            <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Space Rental</p>
                                <p className="text-sm font-bold text-slate-900">{formData.participation.currency} {formData.financeBreakdown.subtotal?.toLocaleString()}</p>
                            </div>`;

if (content.includes('Space Rental')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Admin Summary with Discount Row updated.');
}
