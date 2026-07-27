const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = '<p className="text-2xl font-black text-[#23471d]">{formData.participation.currency === \'INR\' ? `\\u20b9${formData.participation.total?.toLocaleString()}` : `$${formData.participation.total?.toLocaleString()}`}</p>';
const targetBlock = targetStr + '\n                            </div>\n                        </div>';

const newUI = targetBlock + `

                        {/* PAYMENT PLAN SELECTION (ADDED) */}
                        <div className="p-4 bg-[#f8fafc] border border-slate-200 rounded-[2px] mt-3 shadow-sm">
                             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex-1 w-full sm:w-auto">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Selected Payment Plan</label>
                                    <select 
                                        value={formData.paymentPlanType}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const ev = events.find(bev => bev._id === selectedEventId);
                                            const lbl = ev?.paymentPlans?.find(p => p.id === val)?.label || 'Full Payment';
                                            setFormData(prev => ({ ...prev, paymentPlanType: val, paymentPlanLabel: lbl }));
                                        }}
                                        className="rounded-[2px] border border-slate-400 h-9 focus:border-[#23471d] outline-none px-3 w-full text-[12px] font-bold text-[#23471d] bg-white cursor-pointer"
                                    >
                                        {(() => {
                                            const ev = events.find(bev => bev._id === selectedEventId);
                                            const plans = ev?.paymentPlans || [];
                                            if (plans.length === 0) return <option value="full">Full Payment (100%)</option>;
                                            return plans.map(p => (
                                                <option key={p.id} value={p.id}>{p.label} ({p.percentage}%)</option>
                                            ));
                                        })()}
                                    </select>
                                </div>
                                <div className="flex flex-wrap gap-4 items-center">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Amount to Collect</p>
                                        <p className="text-lg font-black text-[#23471d]">
                                            {(() => {
                                                const ev = events.find(bev => bev._id === selectedEventId);
                                                const p = (ev?.paymentPlans || []).find(bp => bp.id === formData.paymentPlanType);
                                                const totalAmount = formData.participation.total;
                                                const amt = p ? Math.round(totalAmount * (p.percentage / 100)) : totalAmount;
                                                return \`\${formData.participation.currency} \${amt.toLocaleString()}\`;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="text-right border-l border-slate-200 pl-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Balance Pending</p>
                                        <p className="text-lg font-black text-red-600">
                                            {(() => {
                                                const ev = events.find(bev => bev._id === selectedEventId);
                                                const p = (ev?.paymentPlans || []).find(bp => bp.id === formData.paymentPlanType);
                                                const totalAmount = formData.participation.total;
                                                const amt = p ? Math.round(totalAmount * (p.percentage / 100)) : totalAmount;
                                                return \`\${formData.participation.currency} \${(totalAmount - amt).toLocaleString()}\`;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                             </div>
                        </div>`;

if (content.indexOf(targetStr) !== -1) {
    content = content.replace(targetBlock, newUI);
    fs.writeFileSync(filePath, content);
    console.log('BookAStand.jsx UI updated.');
} else {
    console.log('Target not found.');
}
