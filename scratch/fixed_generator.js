const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'BookAStand.tsx');

const head = `import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    Send, ChevronRight,
    Info,
    Calendar,
    MapPin,
    Mic2,
    Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    heroBackgroundApi,
    stallApi,
    exhibitorRegistrationApi,
    settingsApi,
    SERVER_URL,
    API_URL,
    eventApi,
    stallRateApi,
    termsApi,
    publicApi,
    verifyApi,
    crmApi,
    eventHighlightsApi,
    countersApi,
    adminApi
} from "@/lib/api";
import Swal from 'sweetalert2';
import PaymentProcessingModal from '@/components/PaymentProcessingModal';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

const loadScript = (src: string) => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const PRIMARY_CATEGORIES = [
    "Medical & Healthcare",
    "AYUSH & Traditional Medicine",
    "Wellness, Fitness & Lifestyle",
    "Nutrition, Organic & Health Foods",
    "Beauty, Personal Care & Aesthetic Wellness",
    "Mental Health, Yoga & Spiritual Wellness",
    "Medical Technology, Diagnostics & Devices",
    "Institutions, Government Bodies & Startups"
];

const SUB_CATEGORIES: Record<string, string[]> = {
    "Medical & Healthcare": ["Hospitals & Clinics", "Pharmaceuticals", "Medical Services", "Healthcare Consultants"],
    "AYUSH & Traditional Medicine": ["Ayurveda Products", "Herbal Medicines", "Panchakarma & Therapies", "AYUSH Institutions"],
    "Wellness, Fitness & Lifestyle": ["Fitness Equipment", "Wellness Centers", "Lifestyle Products", "Preventive Healthcare"],
    "Nutrition, Organic & Health Foods": ["Organic Food Products", "Nutraceuticals", "Supplements", "Functional Foods"],
    "Beauty, Personal Care & Aesthetic Wellness": ["Skincare", "Cosmetics", "Herbal Beauty", "Aesthetic Clinics"],
    "Mental Health, Yoga & Spiritual Wellness": ["Yoga Institutes", "Meditation Services", "Mental Health Solutions", "Spiritual Organizations"],
    "Medical Technology, Diagnostics & Devices": ["Diagnostic Equipment", "Medical Devices", "Digital Health / HealthTech", "AI & Software Solutions"],
    "Institutions, Government Bodies & Startups": ["Government Bodies", "Research Institutes", "Universities", "Startups"]
};

const BUSINESS_TYPES = [
    "Private Ltd. Company",
    "Public Ltd. Company",
    "Partnership Company",
    "Limited Liability Partnership (LLP)",
    "One Person Company",
    "Sole Proprietorship",
    "Section 8 Company",
    "Others"
];

const INDUSTRY_SECTORS = [
    "AYUSH (Ayurveda, Yoga, Unani, Siddha, Homeopathy)",
    "Agriculture, Horticulture & Medicinal Plants",
    "Bio-Energy & Sustainable Living",
    "Fitness & Wellness Industry",
    "Health & Medical Services",
    "Health & Wellness Tourism",
    "Medical Equipment & Healthcare Technology",
    "Medical Tourism",
    "Nutrition & Health Supplements",
    "Organic & Herbal Products",
    "Pharmaceutical Companies",
    "Research, Education & Government Bodies",
    "Others"
];

const NATURE_OF_BUSINESS = [
    "Agency", "Aggregator", "Association", "College", "Dealer", "Digital Media", "Distributor", "Electronic Media",
    "Government Body", "Institution", "Manufacturer", "NGO", "Print Media", "Raw material Supplier",
    "Research Organisation", "Retailer", "Service Provider", "University", "Others"
];

const initialFormData = {
    eventId: '',
    exhibitorName: '',
    typeOfBusiness: '',
    industrySector: '',
    website: '',
    address: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    landlineNo: '',
    gstNo: '',
    panNo: '',
    natureOfBusiness: '',
    fasciaName: '',
    contact1: { title: '', firstName: '', lastName: '', email: '', designation: '', mobile: '', alternateNo: '' },
    contact2: { title: '', firstName: '', lastName: '', email: '', designation: '', mobile: '', alternateNo: '' },
    participation: {
        stallNo: '', stallFor: '', stallSize: 0, stallCategory: '', stallType: 'Shell Space', stallScheme: '', dimension: '',
        currency: 'INR', rate: 0, discount: 0, amount: 0, gstPercent: 18, total: 0
    },
    selectedSectors: [] as string[],
    primaryCategory: '', subCategory: '', otherSector: '', referredBy: '', spokenWith: '', filledBy: 'User',
    paymentMode: 'online' as 'manual' | 'online',
    paymentType: 'full' as 'full' | 'advance',
    paymentPlanType: 'full' as 'full' | 'phase1' | 'phase2' | 'phase3',
    chosenTdsPercent: 0,
    amountPaid: 0, balanceAmount: 0, advancePercentage: 50, status: 'pending', paymentId: '',
    financeBreakdown: { grossAmount: 0, discountPercent: 0, discountAmount: 0, subtotal: 0, tdsAmount: 0, netPayable: 0 },
    razorpayOrderId: '', razorpaySignature: ''
};
`;

const body1 = `
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
    const [searchParams] = useSearchParams();

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
            } catch (error) { console.error("Error fetching initial data:", error); }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            stallApi.getByEvent(selectedEventId).then(data => {
                setAvailableStalls(data);
                if (!data.find(s => s._id === formData.participation.stallNo)) {
                    setFormData(prev => ({ ...prev, participation: { ...prev.participation, stallNo: '' } }));
                }
            });
            stallRateApi.getAllByEvent(selectedEventId).then(rates => setAllRates(rates));
        }
    }, [selectedEventId]);

    const filteredStates = useMemo(() => {
        if (!formData.country || countries.length === 0) return [];
        const selectedCountry = countries.find(c => c.name && c.name.trim().toLowerCase() === formData.country.trim().toLowerCase());
        if (!selectedCountry) return [];
        return states.filter(s => s.countryCode != null && selectedCountry.countryCode != null && String(s.countryCode) === String(selectedCountry.countryCode));
    }, [formData.country, countries, states]);

    const filteredCities = useMemo(() => {
        if (!formData.state || states.length === 0) return [];
        const selectedState = states.find(s => s.name && s.name.trim().toLowerCase() === formData.state.trim().toLowerCase());
        if (!selectedState) return [];
        return cities.filter(c => c.stateCode != null && selectedState.stateCode != null && String(c.stateCode) === String(selectedState.stateCode));
    }, [formData.state, states, cities]);

    useEffect(() => {
        let eTimer: any; let pTimer: any;
        if (emailTimer > 0) eTimer = setInterval(() => setEmailTimer(prev => prev - 1), 1000);
        if (phoneTimer > 0) pTimer = setInterval(() => setPhoneTimer(prev => prev - 1), 1000);
        return () => { if (eTimer) clearInterval(eTimer); if (pTimer) clearInterval(pTimer); };
    }, [emailTimer, phoneTimer]);

    useEffect(() => {
        const updateRate = async () => {
            if (!selectedEventId || !formData.participation.stallType || !formData.participation.currency) return;
            try {
                const rateData = await stallRateApi.getRate(selectedEventId, formData.participation.currency, formData.participation.stallType);
                if (rateData) setFormData(prev => ({ ...prev, participation: { ...prev.participation, rate: rateData.ratePerSqm } }));
            } catch (e) { console.error("Rate fetch error", e); }
        };
        updateRate();
    }, [selectedEventId, formData.participation.stallType, formData.participation.currency]);

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
        if (selectedPlan) paid = Math.round(totalWithGst * (Number(selectedPlan.percentage) / 100));
        setFormData(prev => ({
            ...prev,
            participation: { ...prev.participation, amount: Math.round(subtotal), discount: Math.round(discountAmount + fullDiscA), total: totalWithGst },
            financeBreakdown: { grossAmount: Math.round(subtotal), discountPercent: fullDiscP, discountAmount: fullDiscA, subtotal: subAfterDisc, tdsAmount: tdsA, netPayable: netBase + gst },
            amountPaid: paid, balanceAmount: totalWithGst - paid
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
            } else { setFormData(prev => ({ ...prev, [name]: digitsOnly })); }
            return;
        }
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: newValue } }));
        } else { setFormData(prev => ({ ...prev, [name]: newValue })); }
    };

    const handleSelectChange = (name: string, value: string) => {
        if (name === 'eventId') { setSelectedEventId(value); setFormData(prev => ({ ...prev, eventId: value })); return; }
        if (name === 'country') { setFormData(prev => ({ ...prev, country: value, state: '', city: '' })); return; }
        if (name === 'state') { setFormData(prev => ({ ...prev, state: value, city: '' })); return; }
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: value } }));
        } else { setFormData(prev => ({ ...prev, [name]: value })); }
    };

    const handleStallChange = (stallId: string) => {
        const stall = availableStalls.find(s => s._id === stallId);
        if (stall) {
            setFormData(prev => ({
                ...prev,
                participation: {
                    ...prev.participation, stallNo: stall._id, stallFor: stall.stallNumber, stallSize: stall.area,
                    dimension: \`\${stall.length}x\${stall.width}m\`, stallScheme: stall.plScheme || 'One Side Open',
                    stallType: stall.stallType || prev.participation.stallType
                }
            }));
        }
    };

    const handleExhibitorTypeChange = (type: 'domestic' | 'international') => {
        setExhibitorType(type);
        setFormData(prev => ({
            ...prev, country: type === 'domestic' ? 'India' : '', state: '', city: '',
            participation: { ...prev.participation, currency: type === 'domestic' ? 'INR' : 'USD' }, paymentMode: 'online'
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
                    key: RAZORPAY_KEY_ID, amount: Math.round(gatewayAmount * 100), currency: isUSD ? 'USD' : 'INR',
                    name: "IHWE Registration", description: \`Stand Booking - Stall \${formData.participation.stallFor}\`,
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

    const formatDateRange = (start?: string, end?: string) => {
        if (!start || !end) return "";
        const startDate = new Date(start);
        const endDate = new Date(end);
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const month = startDate.toLocaleString('default', { month: 'long' });
        const year = startDate.getFullYear();
        if (startDate.getMonth() === endDate.getMonth()) { return \`\${startDay} - \${endDay} \${month} \${year}\`; }
        return \`\${startDay} \${month} - \${endDay} \${endDate.toLocaleString('default', { month: 'long' })} \${year}\`;
    };

    const selectedEvent = events.find(e => e._id === selectedEventId);
    
    // UI Helpers
    const selectedStall = useMemo(() =>
        availableStalls.find(s => s._id === formData.participation.stallNo),
        [availableStalls, formData.participation.stallNo]);
`;

const tailScript = `
const fs = require('fs');
const content = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'BookAStand.tsx'), 'utf8');
const lines = content.split('\\n');
const uiIdx = lines.findLastIndex(l => l.includes('return (') && l.includes('<div className="min-h-screen'));
const uiPart = lines.slice(uiIdx).join('\\n');
fs.writeFileSync(path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'BookAStand.tsx'), head + body1 + uiPart);
`;

// I'll execute the stitch directly in node.
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
const uiIdx = lines.findLastIndex(l => l.includes('return (') && l.includes('<div className="min-h-screen'));
const uiPart = lines.slice(uiIdx).join('\n');

fs.writeFileSync(filePath, head + body1 + uiPart);
console.log("Complete Reconstruct Success.");
