const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'BookAStand.tsx');

// I'll define the CLEAN version of the middle part (from line 184 to 764)
const componentBody = `
const BookAStand = () => {
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentModal, setPaymentModal] = useState<{ status: 'processing' | 'success' | 'failed' } | null>(null);
    const [heroData, setHeroData] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [availableStalls, setAvailableStalls] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [marketingStaff, setMarketingStaff] = useState<any[]>([]);
    const [termsContent, setTermsContent] = useState<any>(null);
    const [allRates, setAllRates] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [eventHighlights, setEventHighlights] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [counters, setCounters] = useState<any[]>([]);

    const [formData, setFormData] = useState(initialFormData);

    
    const [exhibitorType, setExhibitorType] = useState<'domestic' | 'international' | null>(null);
    const [usdToInrRate, setUsdToInrRate] = useState<number>(86);
    const [searchParams, setSearchParams] = useSearchParams();

    // Verification States
    const [emailVerified, setEmailVerified] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [emailOtp, setEmailOtp] = useState("");
    const [phoneOtp, setPhoneOtp] = useState("");
    const [emailTimer, setEmailTimer] = useState(0);
    const [phoneTimer, setPhoneTimer] = useState(0);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isPhoneLoading, setIsPhoneLoading] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [hData, eData, employeesRes, staffRes, termsRes, countryRes, stateRes, cityRes, highlightRes, settingsRes, counterRes] = await Promise.all([
                    heroBackgroundApi.getByPage("Registration / Book A Stand"),
                    eventApi.getActive(),
                    publicApi.getEmployees(),
                    publicApi.getStaff(),
                    termsApi.getByPage("exhibitor-registration"),
                    crmApi.getCountries(),
                    crmApi.getStates(),
                    crmApi.getCities(),
                    eventHighlightsApi.get(),
                    settingsApi.get(),
                    countersApi.get()
                ]);

                if (hData) setHeroData((hData as any).data || hData);
                const actualEvents = Array.isArray(eData) ? eData : ((eData as any).data || []);
                if (actualEvents.length > 0) {
                    setEvents(actualEvents);
                    const urlEventId = searchParams.get('eventId');
                    const initialEventId = urlEventId && actualEvents.find((e: any) => e._id === urlEventId) ? urlEventId : actualEvents[0]._id;
                    setSelectedEventId(initialEventId);
                    
                    setFormData(prev => {
                        const selEvent = actualEvents.find((e: any) => e._id === initialEventId);
                        const firstPlan = (selEvent?.paymentPlans && selEvent.paymentPlans.length > 0) ? selEvent.paymentPlans[0].id : 'full';
                        return { ...prev, eventId: initialEventId, paymentPlanType: firstPlan };
                    });
                    
                }
                if (employeesRes) setMarketingStaff(Array.isArray(employeesRes) ? employeesRes : ((employeesRes as any).data || []));
                if (staffRes) setStaff(Array.isArray(staffRes) ? staffRes : ((staffRes as any).data || []));
                if (termsRes) setTermsContent(termsRes);
                if (countryRes) setCountries(countryRes);
                if (stateRes) setStates(stateRes);
                if (cityRes) setCities(cityRes);
                if (highlightRes) setEventHighlights(highlightRes);
                if (settingsRes) setSettings(settingsRes);
                if (counterRes) setCounters(counterRes);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch Stalls when Event changes
    useEffect(() => {
        if (selectedEventId) {
            stallApi.getByEvent(selectedEventId).then(data => {
                setAvailableStalls(data);
                if (!data.find(s => s._id === formData.participation.stallNo)) {
                    setFormData(prev => ({
                        ...prev,
                        participation: { ...prev.participation, stallNo: '' }
                    }));
                }
            });
            stallRateApi.getAllByEvent(selectedEventId).then(rates => {
                setAllRates(rates);
            });
        }
    }, [selectedEventId]);

    const filteredStates = useMemo(() => {
        if (!formData.country || countries.length === 0) return [];
        const selectedCountry = countries.find(c =>
            c.name && c.name.trim().toLowerCase() === formData.country.trim().toLowerCase()
        );
        if (!selectedCountry) return [];
        return states.filter(s =>
            s.countryCode != null && selectedCountry.countryCode != null &&
            String(s.countryCode) === String(selectedCountry.countryCode)
        );
    }, [formData.country, countries, states]);

    const filteredCities = useMemo(() => {
        if (!formData.state || states.length === 0) return [];
        const selectedState = states.find(s =>
            s.name && s.name.trim().toLowerCase() === formData.state.trim().toLowerCase()
        );
        if (!selectedState) return [];
        return cities.filter(c =>
            c.stateCode != null && selectedState.stateCode != null &&
            String(c.stateCode) === String(selectedState.stateCode)
        );
    }, [formData.state, states, cities]);

    // OTP Timers
    useEffect(() => {
        let eTimer: any;
        let pTimer: any;
        if (emailTimer > 0) eTimer = setInterval(() => setEmailTimer(prev => prev - 1), 1000);
        if (phoneTimer > 0) pTimer = setInterval(() => setPhoneTimer(prev => prev - 1), 1000);
        return () => {
            if (eTimer) clearInterval(eTimer);
            if (pTimer) clearInterval(pTimer);
        };
    }, [emailTimer, phoneTimer]);

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

// I'll take the HEAD and TAIL from the existing file as they are likely safe.
// Wait, I can just write the whole thing.

// Headers and initialFormData are lines 1 to 183.
// The rest is the UI and export.
// I'll use a reliable source for the UI.
// Actually, I'll just write the whole file. It's ~1500 lines. Node can handle it.
