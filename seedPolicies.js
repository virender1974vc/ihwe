require('dotenv').config();
const mongoose = require('mongoose');
const LegalPolicy = require('./models/LegalPolicy');

const policies = [
    {
        page: 'terms-of-service',
        title: 'Terms & Conditions – IHWE 2026',
        content: `
<h2>9th Edition of International Health &amp; Wellness Expo 2026 (IHWE – Global Edition) &amp; Associated Programs</h2>
<p><strong>Organised by:</strong> Namo Gange Wellness Pvt. Ltd.<br/>
<strong>In Association With:</strong><br/>
International Council of AYUSH (ICOA) – (Buyer-Seller Meet)<br/>
Namo Gange Trust – (Arogya Sanghosthi / Conferences)</p>

<h3>🔹 1. Acceptance of Terms</h3>
<p>By proceeding with registration and/or payment, the Participant:</p>
<ul>
  <li>Confirms that they have read, understood, and agreed to these Terms &amp; Conditions;</li>
  <li>Enters into a legally binding agreement with Namo Gange Wellness Pvt. Ltd. under the provisions of the Indian Contract Act, 1872;</li>
  <li>Agrees to comply with applicable laws, including the Information Technology Act, 2000.</li>
</ul>

<h3>🔹 2. Scope of Payment</h3>
<p>Payments made through this platform may include, but are not limited to:</p>
<ul>
  <li>Exhibition Stall Booking</li>
  <li>Sponsorship Packages (Expo / Seminar / Conference)</li>
  <li>Buyer / Seller Registration (including ICOA Buyer-Seller Meet)</li>
  <li>Delegate Registration</li>
  <li>Seminar / Conference Participation (Arogya Sanghosthi)</li>
  <li>ICOA Buyer Membership</li>
</ul>

<h3>🔹 3. Payment Confirmation</h3>
<ul>
  <li>Registration/booking shall be deemed confirmed only upon successful receipt of payment by the Organiser.</li>
  <li>A confirmation email, receipt, or invoice shall be issued upon successful transaction.</li>
  <li>In case of incomplete or failed transactions, no booking shall be considered valid.</li>
</ul>

<h3>🔹 4. Pricing &amp; Taxes</h3>
<ul>
  <li>All fees are exclusive of applicable taxes (including GST), unless otherwise specified.</li>
  <li>The Participant agrees to bear all applicable taxes, duties, and statutory charges.</li>
</ul>

<h3>🔹 5. Strict No Refund &amp; Non-Transfer Policy</h3>
<p>All payments are final, non-refundable, and non-transferable. No refund shall be provided under any circumstances, including but not limited to:</p>
<ul>
  <li>Cancellation by the Participant</li>
  <li>No-show or partial participation</li>
  <li>Change in business plans, schedule, or preferences</li>
</ul>
<p>This clause constitutes a binding agreement and shall be enforceable under applicable Indian laws.</p>

<h3>🔹 6. Cancellation / Rescheduling by Organiser</h3>
<p>The Organiser reserves the right to reschedule or modify the Event. In such cases:</p>
<ul>
  <li>Registration shall remain valid for revised dates</li>
  <li>No refund obligation shall arise</li>
</ul>

<h3>🔹 7. Payment Modes</h3>
<p>Payments shall be made only through authorised channels: UPI / Net Banking / Debit Card / Credit Card / Official Bank Transfer. The Organiser shall not be responsible for payments made through unauthorised modes or third parties.</p>

<h3>🔹 8. Transaction Failure &amp; Payment Disputes</h3>
<ul>
  <li>Refunds (if any) shall be processed as per bank/payment gateway policies</li>
  <li>The Organiser shall not be liable for delays caused by banks or payment gateways</li>
  <li>Any discrepancy must be reported within 7 (seven) days of transaction</li>
</ul>

<h3>🔹 14. Governing Law &amp; Jurisdiction</h3>
<p>These Terms shall be governed by the laws of India. All disputes shall be subject to the exclusive jurisdiction of Courts in Delhi NCR, India.</p>

<hr/>
<p><strong>Contact:</strong> <a href="mailto:info@namogangewellness.com">info@namogangewellness.com</a> | <a href="tel:+91-9654900525">+91-9654900525</a> | <a href="https://namogangewellness.com" target="_blank">namogangewellness.com</a></p>
`
    },
    {
        page: 'privacy-policy',
        title: 'Privacy Policy – IHWE 2026',
        content: `
<h2>🔐 Privacy Policy</h2>
<p><em>(In accordance with applicable Indian laws including the Information Technology Act, 2000)</em></p>
<h2>9th Edition of International Health &amp; Wellness Expo 2026 (IHWE – Global Edition) &amp; Associated Programs</h2>
<p><strong>Organised by:</strong> Namo Gange Wellness Pvt. Ltd.<br/>
<strong>In Association With:</strong><br/>
International Council of AYUSH (ICOA) – (Buyer-Seller Meet)<br/>
Namo Gange Trust – (Arogya Sanghosthi / Conferences)</p>

<h3>🔹 1. Scope and Applicability</h3>
<p>This Privacy Policy governs the collection, use, processing, storage, and disclosure of personal data by Namo Gange Wellness Pvt. Ltd. in relation to website access, exhibition participation, stall booking, Buyer-Seller Meet, conferences, delegate registrations, memberships, sponsorships, and payments.</p>

<h3>🔹 4. Purpose of Data Processing</h3>
<ul>
  <li>Registration and event participation management</li>
  <li>Buyer-Seller matchmaking and business networking</li>
  <li>Communication (email, SMS, WhatsApp, calls)</li>
  <li>Issuance of invoices, badges, passes, and confirmations</li>
</ul>

<h3>🔹 5. Data Sharing &amp; Disclosure</h3>
<p>We may share personal data strictly on a need-to-know basis with participants and associate partners.</p>

<hr/>
<p><strong>Contact:</strong> <a href="mailto:info@namogangewellness.com">info@namogangewellness.com</a> | <a href="tel:+91-9654900525">+91-9654900525</a></p>
`
    },
    {
        page: 'refund-policy',
        title: 'Refund & Cancellation Policy – IHWE 2026',
        content: `
<h2>Refund &amp; Cancellation Policy</h2>
<h2>9th Edition of International Health &amp; Wellness Expo 2026 (IHWE – Global Edition) &amp; Associated Programs</h2>

<h3>🔹 1. General Refund Policy</h3>
<p>All payments made to Namo Gange Wellness Pvt. Ltd. are <strong>strictly non-refundable and non-transferable</strong>. By making payment, the Participant acknowledges and agrees to this policy.</p>

<h3>🔹 2. No Refund Scenarios</h3>
<p>No refund shall be provided under any circumstances, including cancellation by the participant or non-attendance.</p>

<hr/>
<p><strong>Contact:</strong> <a href="mailto:info@namogangewellness.com">info@namogangewellness.com</a> | <a href="tel:+91-9654900525">+91-9654900525</a></p>
`
    },
    // Aliases for frontend mapping
    {
        page: 'payment',
        title: 'Payment Terms – IHWE 2026',
        content: `
<h2>Payment Terms &amp; Conditions</h2>
<p>All international payments must be made in USD through authorized banking channels or secure credit card gateways. Payments are non-refundable.</p>
<h3>🔹 1. Currency</h3>
<p>Prices are quoted in USD. Local taxes and bank charges are to be borne by the participant.</p>
`
    },
    {
        page: 'refund',
        title: 'Refund Policy – IHWE 2026',
        content: `
<h2>Refund &amp; Cancellation Policy</h2>
<p>All international registration and booking fees are <strong>strictly non-refundable</strong>.</p>
<p>In case of visa rejection, the participation fee may be adjusted against future events at the sole discretion of the organizer, but no refund will be issued.</p>
`
    },
    {
        page: 'privacy',
        title: 'Privacy Policy – IHWE 2026',
        content: `
<h2>Privacy Policy</h2>
<p>We value your privacy. Your data is used exclusively for event matchmaking and communication. We do not sell your data to third parties.</p>
`
    }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN || process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        for (const policy of policies) {
            await LegalPolicy.findOneAndUpdate(
                { page: policy.page },
                policy,
                { upsert: true, new: true }
            );
            console.log(`✅ Seeded: ${policy.title} (${policy.page})`);
        }

        console.log('\n🎉 All policies seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding policies:', error);
        process.exit(1);
    }
};

seed();
