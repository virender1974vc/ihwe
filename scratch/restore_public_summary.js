const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'BookAStand.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /<p className="text-2xl font-black">\{formData\.participation\.currency === 'INR' \? '₹' : '\$'\} \{fmtAmt\(formData\.amountPaid\)\}<\/p>[\s\S]+?\{formData\.balanceAmount > 0 && \([\s\S]+?<\/div>[\s\S]+?\}\)/;

// I'll just replace the whole summary section with a clean version.
const startMarker = '<div className="w-full">                                                            <div className="flex justify-between items-center mb-3">';
const endMarker = 'Total: {formData.participation.currency === \'INR\' ? \'₹\' : \'$\'}{(formData.amountPaid * 1.025).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n                                                                            </p>\n                                                                        </div>\n                                                                    )}\n                                                                </div>\n                                                            </div>\n                                                        </div>';

const cleanSummary = `<div className="w-full">                                                            <div className="flex justify-between items-center mb-3">
                                                                <h3 className="text-sm font-bold text-slate-900 uppercase">Booking Summary</h3>
                                                                <div className="flex gap-2">
                                                                    <div className="text-right">
                                                                        <Label className="text-[8px] font-bold text-slate-400 uppercase">Plan</Label>
                                                                        <select
                                                                            value={formData.paymentPlanType}
                                                                            onChange={(e) => setFormData(prev => ({ ...prev, paymentPlanType: e.target.value as any }))}
                                                                            className="h-7 px-2 border border-slate-500 rounded-[2px] text-[10px] font-bold text-slate-900 bg-white outline-none focus:border-[#23471d]"
                                                                        >
                                                                            {(() => {
                                                                                const ev = events.find(e => (e as any)._id === selectedEventId);
                                                                                const plans = ev?.paymentPlans || [];
                                                                                if (plans.length === 0) return <option value="full">Full Payment (100%)</option>;
                                                                                return plans.map((p: any) => (
                                                                                    <option key={p.id} value={p.id}>{p.label} ({p.percentage}%)</option>
                                                                                ));
                                                                            })()}
                                                                        </select>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <Label className="text-[8px] font-bold text-slate-400 uppercase">TDS</Label>
                                                                        <select
                                                                            value={formData.chosenTdsPercent}
                                                                            onChange={(e) => setFormData(prev => ({ ...prev, chosenTdsPercent: Number(e.target.value) }))}
                                                                            className="h-7 px-2 border border-slate-500 rounded-[2px] text-[10px] font-bold text-slate-900 bg-white outline-none focus:border-[#23471d]"
                                                                        >
                                                                            <option value="0">None (0%)</option>
                                                                            <option value="1">1% (194C)</option>
                                                                            <option value="2">2% (194C)</option>
                                                                            <option value="10">10% (194J)</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1 text-xs border-t border-slate-500 pt-3">
                                                                <div className="flex justify-between text-slate-600">
                                                                    <span className="font-medium">Gross Stall Cost ({formData.participation.stallSize} sqm)</span>
                                                                    <span className="font-semibold">{formData.participation.currency === 'INR' ? '₹' : '$'} {fmtAmt(formData.financeBreakdown.grossAmount)}</span>
                                                                </div>
                                                                
                                                                {formData.financeBreakdown.discountAmount > 0 && (
                                                                    <div className="flex justify-between text-blue-600">
                                                                        <span className="font-semibold italic">Less: {formData.financeBreakdown.discountPercent}% Plan Discount</span>
                                                                        <span className="font-bold">- {formData.participation.currency === 'INR' ? '₹' : '$'} {fmtAmt(formData.financeBreakdown.discountAmount)}</span>
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-between bg-slate-50 px-2 py-1 my-1 border-y border-slate-200">
                                                                    <span className="font-bold text-slate-700">Subtotal</span>
                                                                    <span className="font-bold text-slate-900">{formData.participation.currency === 'INR' ? '₹' : '$'} {fmtAmt(formData.financeBreakdown.subtotal)}</span>
                                                                </div>

                                                                {formData.financeBreakdown.tdsAmount > 0 && (
                                                                    <div className="flex justify-between text-red-600 px-2">
                                                                        <span className="font-semibold italic">Less: TDS @ {formData.chosenTdsPercent}%</span>
                                                                        <span className="font-bold">- {formData.participation.currency === 'INR' ? '₹' : '$'} {fmtAmt(formData.financeBreakdown.tdsAmount)}</span>
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-between text-slate-500 px-2">
                                                                    <span>GST (18%) on Subtotal</span>
                                                                    <span className="font-bold">+ {formData.participation.currency === 'INR' ? '₹' : '$'} {fmtAmt(formData.participation.total - formData.financeBreakdown.subtotal)}</span>
                                                                </div>

                                                                <div className="flex justify-between border-t border-slate-500 mt-2 pt-2 px-2">
                                                                    <span className="font-bold text-slate-800 uppercase text-[10px]">Total Contract Value</span>
                                                                    <span className="font-bold text-slate-900">{formData.participation.currency === 'INR' ? '₹' : '$'} {fmtAmt(formData.participation.total)}</span>
                                                                </div>
                                                                
                                                                {formData.financeBreakdown.tdsAmount > 0 && (
                                                                    <div className="flex justify-between border-t border-slate-200 mt-1 pt-1 px-2 bg-green-50">
                                                                        <span className="font-black text-green-800 uppercase text-[10px]">Net Payable to us</span>
                                                                        <span className="font-black text-green-900">{formData.participation.currency === 'INR' ? '₹' : '$'} {fmtAmt(formData.financeBreakdown.netPayable)}</span>
                                                                    </div>
                                                                )}

                                                                <div className="mt-4 p-4 bg-[#23471d] text-white rounded-sm shadow-md">
                                                                    <div className="flex justify-between items-center">
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-white/70 uppercase">
                                                                                Payable Now ({(() => {
                                                                                    const ev = events.find(e => (e as any)._id === selectedEventId);
                                                                                    const p = (ev?.paymentPlans || []).find((p: any) => p.id === formData.paymentPlanType);
                                                                                    if (p) return \`\${p.percentage}%\`;
                                                                                    return formData.paymentPlanType === 'full' ? '100%' : (formData.paymentPlanType === 'phase1' ? '25%' : (formData.paymentPlanType === 'phase2' ? '50%' : '75%'));
                                                                                })()})
                                                                            </p>
                                                                            <p className="text-[14px] font-black uppercase tracking-tight">Final Amount</p>
                                                                        </div>
                                                                        <p className="text-2xl font-black">{formData.participation.currency === 'INR' ? '₹' : '$'} {fmtAmt(formData.amountPaid)}</p>
                                                                    </div>
                                                                    {formData.balanceAmount > 0 && (
                                                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10 opacity-70">
                                                                            <p className="text-[9px] font-bold text-white/50 uppercase">Balance Remaining</p>
                                                                            <p className="text-[12px] font-bold">{formData.participation.currency === 'INR' ? '₹' : '$'} {fmtAmt(formData.balanceAmount)}</p>
                                                                        </div>
                                                                    )}

                                                                    {formData.paymentMode === 'online' && formData.amountPaid > 0 && (
                                                                        <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center">
                                                                            <p className="text-[9px] text-white/60 font-bold uppercase">Includes 2.5% Gateway Charging Fee</p>
                                                                            <p className="text-[12px] font-black text-orange-300">
                                                                                Total: {formData.participation.currency === 'INR' ? '₹' : '$'}{(formData.amountPaid * 1.025).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>`;

// String based replace since regex with template literals is hard
const splitPart = content.split(startMarker);
if (splitPart.length > 1) {
    const splitPart2 = splitPart[splitPart.length - 1].split(endMarker);
    if (splitPart2.length > 1) {
         // This is complex because there are likely MULTIPLE startMarkers now due to duplication.
         // I'll use a regex to match the broken duplicated block.
    }
}

// Looser regex to grab the whole mess
const looseRegex = /<div className="w-full">\s+<div className="flex justify-between items-center mb-3">[\s\S]+?Gateway Charging Fee[\s\S]+?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>/;

if (looseRegex.test(content)) {
    content = content.replace(looseRegex, cleanSummary);
    fs.writeFileSync(filePath, content);
    console.log('Public BookAStand.tsx Summary Restored.');
} else {
    console.log('Loose match failed.');
}
