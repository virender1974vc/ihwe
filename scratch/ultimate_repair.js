const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'BookAStand.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const head = lines.slice(0, 332).join('\n'); // Up to OTP timers

const tailIdx = lines.findIndex(l => l.includes('return ('));
const tail = lines.slice(tailIdx).join('\n');

const correctMiddle = `
    // Rate Calculation Effect
    useEffect(() => {
        const updateRate = async () => {
            if (!selectedEventId || !formData.participation.stallType || !formData.participation.currency) return;
            try {
                const rateData = await stallRateApi.getRate(selectedEventId, formData.participation.currency, formData.participation.stallType);
                if (rateData) {
                    setFormData(prev => ({
                        ...prev,
                        participation: { ...prev.participation, rate: rateData.ratePerSqm }
                    }));
                }
            } catch (e) {
                console.error("Rate fetch error", e);
            }
        };
        updateRate();
    }, [selectedEventId, formData.participation.stallType, formData.participation.currency]);

    // Final Total Calculation
    useEffect(() => {
        const part = formData.participation;
        const rate = Number(part.rate) || 0;
        const size = Number(part.stallSize) || 0;

        const stall = availableStalls.find(s => s._id === part.stallNo);
        const incPercent = stall?.incrementPercentage || 0;
        const discPercent = stall?.discountPercentage || 0;

        const baseAmount = rate * size;
        const withInc = baseAmount * (1 + incPercent / 100);
        const discountAmount = withInc * (discPercent / 100);
        const subtotal = withInc - discountAmount;
        
        // --- FINANCE LOGIC ---
        const currentEvent = events.find(e => (e as any)._id === selectedEventId);
        const plan = formData.paymentPlanType;
        const selectedPlan = (currentEvent?.paymentPlans || []).find((p: any) => p.id === plan);
        
        const isFullPlan = plan === 'full' || (selectedPlan && Number(selectedPlan.percentage) === 100);
        const fullDiscP = isFullPlan ? (settings?.fullPaymentDiscount ?? 5) : 0;
        const fullDiscA = Math.round(subtotal * (fullDiscP / 100));
        const subAfterDisc = subtotal - fullDiscA;
        
        const tdsP = formData.chosenTdsPercent;
        const tdsA = Math.round(subAfterDisc * (tdsP / 100));
        const netBase = subAfterDisc - tdsA;
        
        const gst = Math.round(subAfterDisc * 0.18);
        const totalWithGst = subAfterDisc + gst;
        
        let paid = totalWithGst;
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
                netPayable: netBase + gst
            },
            amountPaid: paid,
            balanceAmount: totalWithGst - paid
        }));
    }, [formData.participation.rate, formData.participation.stallSize, formData.participation.stallNo, formData.paymentPlanType, formData.chosenTdsPercent, settings, events, selectedEventId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'contact1.email') setEmailVerified(false);
        if (name === 'contact1.mobile') setPhoneVerified(false);
        const isNameOrDesignation = name.includes('firstName') || name.includes('lastName') || name.includes('designation');
        let newValue = value;
        if (isNameOrDesignation) newValue = value.replace(/[0-9]/g, '');
        if (name === 'landlineNo') newValue = value.replace(/\\D/g, '');

        const isMobileField = name === 'contact1.mobile' || name === 'contact2.mobile' || name === 'contact1.alternateNo' || name === 'contact2.alternateNo';
        if (isMobileField && exhibitorType === 'domestic') {
            const digitsOnly = newValue.replace(/\\D/g, '').slice(0, 10);
            if (name.includes('.')) {
                const [parent, child] = name.split('.');
                setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: digitsOnly } }));
            } else {
                setFormData(prev => ({ ...prev, [name]: digitsOnly }));
            }
            return;
        }

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: newValue } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: newValue }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        if (name === 'eventId') { setSelectedEventId(value); setFormData(prev => ({ ...prev, eventId: value })); return; }
        if (name === 'country') { setFormData(prev => ({ ...prev, country: value, state: '', city: '' })); return; }
        if (name === 'state') { setFormData(prev => ({ ...prev, state: value, city: '' })); return; }
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleStallChange = (stallId: string) => {
        const stall = availableStalls.find(s => s._id === stallId);
        if (stall) {
            setFormData(prev => ({
                ...prev,
                participation: {
                    ...prev.participation,
                    stallNo: stall._id,
                    stallFor: stall.stallNumber,
                    stallSize: stall.area,
                    dimension: \`\${stall.length}x\${stall.width}m\`,
                    stallScheme: stall.plScheme || 'One Side Open',
                    stallType: stall.stallType || prev.participation.stallType
                }
            }));
        }
    };

    const handleExhibitorTypeChange = (type: 'domestic' | 'international') => {
        setExhibitorType(type);
        setFormData(prev => ({
            ...prev,
            country: type === 'domestic' ? 'India' : '',
            state: '',
            city: '',
            participation: { ...prev.participation, currency: type === 'domestic' ? 'INR' : 'USD' },
            paymentMode: 'online'
        }));
        if (type === 'international') {
            fetch(\`\${API_URL}/exchange-rate/usd-to-inr\`).then(r => r.json()).then(res => { if (res.success && res.rate) setUsdToInrRate(res.rate); }).catch(() => {});
        }
    };

    const handleSectorToggle = (sector: string) => {
        setFormData(prev => {
            const current = [...prev.selectedSectors];
            const idx = current.indexOf(sector);
            if (idx > -1) current.splice(idx, 1); else current.push(sector);
            return { ...prev, selectedSectors: current };
        });
    };

    const handleSendEmailOtp = async () => {
        if (!formData.contact1.email) { setVerificationError("Please enter your official email first."); return; }
        setIsEmailLoading(true); setVerificationError(null);
        try {
            const res = await verifyApi.sendEmailOtp(formData.contact1.email, 'EXHIBITOR');
            if (res.success) setEmailTimer(60); else setVerificationError(res.message || "Failed to send email OTP.");
        } catch { setVerificationError("Failed to send email OTP."); } finally { setIsEmailLoading(false); }
    };

    const handleVerifyEmailOtp = async () => {
        if (!emailOtp || emailOtp.length < 6) { setVerificationError("Please enter a valid OTP."); return; }
        setIsEmailLoading(true); setVerificationError(null);
        try {
            const res = await verifyApi.verifyEmailOtp(formData.contact1.email, emailOtp);
            if (res.success) { setEmailVerified(true); setEmailOtp(""); } else setVerificationError("Invalid OTP.");
        } catch { setVerificationError("Verification failed."); } finally { setIsEmailLoading(false); }
    };

    const handleSendPhoneOtp = async () => {
        if (!formData.contact1.mobile) { setVerificationError("Please enter mobile."); return; }
        setIsPhoneLoading(true); setVerificationError(null);
        try {
            const res = await verifyApi.sendPhoneOtp(formData.contact1.mobile, 'EXHIBITOR');
            if (res.success) setPhoneTimer(60); else setVerificationError(res.message);
        } catch { setVerificationError("Failed."); } finally { setIsPhoneLoading(false); }
    };

    const handleVerifyPhoneOtp = async () => {
        if (!phoneOtp || phoneOtp.length < 6) return;
        setIsPhoneLoading(true);
        try {
            const res = await verifyApi.verifyPhoneOtp(formData.contact1.mobile, phoneOtp);
            if (res.success) { setPhoneVerified(true); setPhoneOtp(""); }
        } catch {} finally { setIsPhoneLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailVerified || !phoneVerified) { setVerificationError("Verify email/whatsapp."); return; }
        if (!formData.participation.stallNo) { Swal.fire('Error', 'Stall required', 'error'); return; }
        setIsLoading(true);
        try {
            if (formData.paymentMode === 'online') {
                const isLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
                if (!isLoaded) return;
                const isUSD = formData.participation.currency === 'USD';
                const finalAmount = formData.amountPaid;
                const gatewayAmount = Math.round(finalAmount * 1.025 * 100) / 100;
                const options = {
                    key: RAZORPAY_KEY_ID,
                    amount: Math.round(gatewayAmount * 100),
                    currency: isUSD ? 'USD' : 'INR',
                    name: "IHWE Registration",
                    description: \`Stand Booking - Stall \${formData.participation.stallFor}\`,
                    handler: async (response: any) => {
                        setPaymentModal({ status: 'processing' });
                        try {
                            const currentEvent = events.find(e => (e as any)._id === selectedEventId);
                            const selectedPlan = (currentEvent?.paymentPlans || []).find((p: any) => p.id === formData.paymentPlanType);
                            const planLabel = selectedPlan ? selectedPlan.label : 'Full Payment';
                            const finalData = { ...formData, razorpayOrderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature, paymentPlanLabel: planLabel, status: formData.paymentPlanType === 'full' ? 'paid' : 'advance-paid' };
                            const submitRes = await exhibitorRegistrationApi.submit(finalData);
                            if (submitRes.success) {
                                setPaymentModal({ status: 'success' });
                                setTimeout(() => { setPaymentModal(null); setSubmitted(true); window.scrollTo(0,0); }, 2500);
                            } else { setPaymentModal({ status: 'failed' }); }
                        } catch { setPaymentModal({ status: 'failed' }); }
                    },
                    prefill: { name: \`\${formData.contact1.firstName} \${formData.contact1.lastName}\`, email: formData.contact1.email, contact: formData.contact1.mobile },
                    theme: { color: "#23471d" }
                };
                new (window as any).Razorpay(options).open();
            }
        } catch {} finally { setIsLoading(false); }
    };

    const fmtAmt = (n: number) => Math.round(n).toLocaleString('en-IN');
    const inputClasses = "rounded-[2px] border-slate-400 h-8 text-[12px] px-3 w-full";
    const labelClasses = "text-[10px] font-bold uppercase text-slate-800 mb-1 block";

    const formatDateRange = (s?: string, e?: string) => "";
    const selectedEvent = events.find(e => e._id === selectedEventId);
`;

fs.writeFileSync(filePath, head + correctMiddle + tail);
console.log("Ultimate Repair Finished.");
