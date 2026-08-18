const mongoose = require('mongoose');

const msmePmsSchemeSchema = new mongoose.Schema({
    exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExhibitorRegistration', index: true, sparse: true },
    applicationId: { type: String, unique: true, sparse: true, index: true },
    applicationType: { type: String, enum: ['public_lead', 'exhibitor_claim'], default: 'public_lead', index: true },
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    emailId: { type: String, required: true },
    udyamNumber: { type: String, required: true },
    gstNumber: { type: String },
    category: { type: String, required: true },
    companyBrief: { type: String, required: true },
    documents: [{
        documentType: String,
        filename: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
        // AI verification result captured at upload time (see
        // aiDocumentVerificationService.verifyDocument) — kept even for an
        // accepted upload so the exhibitor can see *why* AI passed it, not
        // just that it did.
        aiVerification: {
            checked: { type: Boolean, default: false },
            reason: { type: String, default: '' },
        },
        // Field values (Udyam number, GSTIN, account number, etc.) the AI read
        // directly off the uploaded document — see buildMsmeExtractionPrompt in
        // aiDocumentVerificationService.js. Shape varies by documentType, so
        // Mixed rather than a fixed schema.
        extractedDetails: { type: mongoose.Schema.Types.Mixed, default: null },
        // Admin's own review decision on this specific document, separate from
        // the AI's moderation-only check above. Doubles as the "CRM Status"
        // column on the admin tracking page.
        status: { type: String, enum: ['Submitted', 'Verified', 'Rejected'], default: 'Submitted' },
        // The same document also has to be uploaded on the external
        // msme.gov.in portal — tracked independently of the CRM upload above,
        // since the two can happen at different times.
        uploadedOnPortal: Date,
        portalStatus: { type: String, enum: ['', 'Accepted', 'Pending', 'Rejected'], default: '' },
        // Some claim documents don't apply to every exhibitor (e.g. a
        // Category Certificate only applies to SC/ST/OBC applicants) — a
        // third state distinct from "required but missing".
        notApplicable: { type: Boolean, default: false },
        uploadedBy: { type: String, default: '' },
    }],
    applicantDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    bankDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    selectedExpenses: { type: [String], default: [] },
    declarationAgreed: { type: Boolean, default: false },
    currentStep: { type: Number, min: 1, max: 5, default: 1 },
    completedSteps: { type: [Number], default: [] },
    submittedAt: Date,
    statusHistory: [{
        status: String,
        note: String,
        changedBy: String,
        changedAt: { type: Date, default: Date.now }
    }],
    is_lead: { type: Boolean, default: false },
    status: { type: String, enum: ['Draft', 'Pending', 'Under Review', 'Query Raised', 'Approved', 'Rejected'], default: 'Pending' },
    // Which of the 3 admin-facing lifecycle stages this claim is at (shown as
    // a stepper on the admin tracking page): 1 = Application & Documents,
    // 2 = Review & Approval, 3 = Claim & Reimbursement. Independent of
    // `status` above — an admin manually advances a case through the funnel
    // as work actually happens, it isn't inferred.
    pmsStage: { type: Number, min: 1, max: 3, default: 1 },
    // Tracks this claim's submission on the external msme.gov.in PMS portal —
    // separate from our own internal applicationId/status, since the two are
    // filed and tracked independently.
    msmePortal: {
        applicationNo: { type: String, default: '' },
        submittedOn: Date,
        submittedBy: { type: String, default: '' },
        submittedByRole: { type: String, default: '' },
        currentStatus: { type: String, default: '' },
        lastStatusChecked: Date,
        acknowledgementFile: { type: String, default: '' },
        acknowledgementFileName: { type: String, default: '' },
        acknowledgementFileSize: { type: Number, default: 0 },
        remarks: { type: String, default: '' },
    },
    // Full Udyam certificate detail, entered/confirmed by an admin (typically
    // pre-filled from AI extraction at upload time) — richer than the single
    // udyamNumber/category fields above, shown on the Stage 1 overview card.
    udyamDetails: {
        registrationType: { type: String, default: '' },
        enterpriseType: { type: String, default: '' },
        majorActivity: { type: String, default: '' },
        socialCategory: { type: String, default: '' },
        constitution: { type: String, default: '' },
        dateOfIncorporation: Date,
    },
    // AI-generated PMS eligibility screening for this claim — same
    // categoryMatch/riskLevel/recommendation shape produced for Book a Stand
    // (see buildMsmeEligibilityScreeningPrompt), run here against the
    // claim's own uploaded Udyam certificate + applicant details.
    aiScreening: {
        pmsEligible: { type: Boolean, default: null },
        categoryMatch: { type: Boolean, default: null },
        bestMatchingCategory: { type: String, default: '' },
        nicCodeMatch: { type: String, default: '' },
        riskLevel: { type: String, enum: ['', 'Low', 'Medium', 'High'], default: '' },
        recommendation: { type: String, default: '' },
        comments: { type: [String], default: [] },
        screenedAt: Date,
    },
    // Who receives the OTP when the exhibitor's claim is actioned on the
    // msme.gov.in portal directly — can differ from the CRM contact person.
    portalOtpContact: {
        contactPerson: { type: String, default: '' },
        mobile: { type: String, default: '' },
        mobileVerified: { type: Boolean, default: false },
        email: { type: String, default: '' },
        emailVerified: { type: Boolean, default: false },
    },
    // Set by an admin when something further is needed from the exhibitor
    // before the claim can move forward (e.g. a missing payment document).
    actionRequired: {
        message: { type: String, default: '' },
        dueDate: Date,
        resolved: { type: Boolean, default: true },
        createdAt: Date,
    },
}, { timestamps: true });

msmePmsSchemeSchema.index(
    { exhibitorId: 1, applicationType: 1 },
    { unique: true, partialFilterExpression: { applicationType: 'exhibitor_claim' } }
);

module.exports = mongoose.model('MsmePmsScheme', msmePmsSchemeSchema);
