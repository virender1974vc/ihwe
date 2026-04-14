require('dotenv').config();
const mongoose = require('mongoose');
const LegalPolicy = require('./models/LegalPolicy');

const policies = [
    {
        page: 'terms-of-service',
        title: 'Terms & Conditions – IH&WE 2026',
        content: `
<h2>9th Edition of International Health &amp; Wellness Expo 2026 (IH&WE – Global Edition) &amp; Associated Programs</h2>
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

<h3>🔹 9. Chargeback &amp; Fraud Policy</h3>
<p>Initiating a chargeback without valid grounds shall be treated as breach of agreement. The Organiser reserves the right to:</p>
<ul>
  <li>Suspend or cancel participation</li>
  <li>Recover dues through legal means</li>
  <li>Initiate appropriate legal proceedings</li>
</ul>

<h3>🔹 10. Role of Associate Partners</h3>
<p>International Council of AYUSH (ICOA) and Namo Gange Trust act solely as facilitation / knowledge partners. They shall not be responsible for collection of payments, refunds, cancellations, or financial disputes. All financial transactions are managed exclusively by the Organiser.</p>

<h3>🔹 11. Limitation of Liability</h3>
<p>To the maximum extent permitted under applicable law, the Organiser shall not be liable for any direct or indirect loss, business loss, missed opportunities, or damages. Participation is at the sole risk of the Participant.</p>

<h3>🔹 12. Indemnity</h3>
<p>The Participant agrees to indemnify and hold harmless Namo Gange Wellness Pvt. Ltd., its directors, employees, affiliates, and partners against any claims, damages, liabilities, or expenses arising from payment disputes, misrepresentation, or breach of these Terms.</p>

<h3>🔹 13. Force Majeure</h3>
<p>The Organiser shall not be liable for failure or delay due to natural disasters, government restrictions, pandemic, or unforeseen circumstances.</p>

<h3>🔹 14. Governing Law &amp; Jurisdiction</h3>
<p>These Terms shall be governed by the laws of India. All disputes shall be subject to the exclusive jurisdiction of Courts in Delhi NCR, India.</p>

<hr/>
<p><strong>Contact:</strong> <a href="mailto:info@namogangewellness.com">info@namogangewellness.com</a> | <a href="tel:+91-9654900525">+91-9654900525</a> | <a href="https://namogangewellness.com" target="_blank">namogangewellness.com</a></p>
`
    },
    {
        page: 'privacy-policy',
        title: 'Privacy Policy – IH&WE 2026',
        content: `
<h2>🔐 Privacy Policy</h2>
<p><em>(In accordance with applicable Indian laws including the Information Technology Act, 2000)</em></p>
<h2>9th Edition of International Health &amp; Wellness Expo 2026 (IH&WE – Global Edition) &amp; Associated Programs</h2>
<p><strong>Organised by:</strong> Namo Gange Wellness Pvt. Ltd.<br/>
<strong>In Association With:</strong><br/>
International Council of AYUSH (ICOA) – (Buyer-Seller Meet)<br/>
Namo Gange Trust – (Arogya Sanghosthi / Conferences)</p>

<h3>🔹 1. Scope and Applicability</h3>
<p>This Privacy Policy governs the collection, use, processing, storage, and disclosure of personal data by Namo Gange Wellness Pvt. Ltd. in relation to website access, exhibition participation, stall booking, Buyer-Seller Meet, conferences, delegate registrations, memberships, sponsorships, and payments. By accessing the website or submitting information, the Participant agrees to this Policy.</p>

<h3>🔹 2. Legal Basis for Processing</h3>
<p>We process personal data in accordance with:</p>
<ul>
  <li>The Information Technology Act, 2000</li>
  <li>The IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
  <li>Applicable contractual obligations and lawful business interests</li>
</ul>

<h3>🔹 3. Categories of Information Collected</h3>
<p><strong>3.1 Personal Information:</strong> Full name, designation, organisation name, contact details (mobile number, email address), address (city, state, country).</p>
<p><strong>3.2 Business Information:</strong> Business profile, turnover, industry, product interests, sourcing preferences.</p>
<p><strong>3.3 Financial &amp; Transactional Information:</strong> Transaction reference numbers, payment status (processed via authorised payment gateways). <em>We do not collect or store sensitive banking details such as card numbers, CVV, or passwords.</em></p>
<p><strong>3.4 Technical &amp; Usage Data:</strong> IP address, browser type, device information, website usage patterns (via cookies and analytics tools).</p>

<h3>🔹 4. Purpose of Data Processing</h3>
<ul>
  <li>Registration and event participation management</li>
  <li>Buyer-Seller matchmaking and business networking</li>
  <li>Communication (email, SMS, WhatsApp, calls)</li>
  <li>Issuance of invoices, badges, passes, and confirmations</li>
  <li>Marketing, promotions, and future event updates (subject to consent)</li>
  <li>Legal compliance and dispute resolution</li>
</ul>

<h3>🔹 5. Data Sharing &amp; Disclosure</h3>
<p>We may share personal data strictly on a need-to-know basis with:</p>
<ul>
  <li><strong>Event Participants:</strong> Exhibitors, buyers, and business stakeholders for matchmaking purposes</li>
  <li><strong>Associate Partners:</strong> ICOA – for Buyer-Seller Meet; Namo Gange Trust – for conferences</li>
  <li><strong>Service Providers:</strong> Payment gateway providers, CRM, IT infrastructure, and marketing agencies</li>
</ul>
<p><em>We do not sell, rent, or trade personal data to third parties.</em></p>

<h3>🔹 6. Data Security Measures</h3>
<p>The Company implements reasonable security practices including secure servers, encrypted systems, access control, restricted data access, and regular monitoring. However, no digital system is completely secure, and data is shared at the Participant's own risk.</p>

<h3>🔹 7. Data Retention Policy</h3>
<p>Personal data shall be retained only for as long as necessary to fulfil event execution, business and legal requirements. Certain data may be retained for audit, compliance, or legal obligations.</p>

<h3>🔹 8. User Rights</h3>
<p>Subject to applicable laws, Participants may request access to their personal data, request correction of inaccurate data, or withdraw consent for marketing communications. Requests may be submitted to the contact details below.</p>

<h3>🔹 9. Cookies &amp; Tracking Technologies</h3>
<p>The website may use cookies and analytics tools to enhance user experience. Users may disable cookies through browser settings; however, this may affect functionality.</p>

<h3>🔹 10. Third-Party Platforms</h3>
<p>The website may contain links to third-party websites or services. The Company shall not be responsible for their privacy practices or content.</p>

<h3>🔹 11. Children's Privacy</h3>
<p>The services are intended for business professionals. The Company does not knowingly collect data from individuals below 18 years of age.</p>

<h3>🔹 12. Limitation of Liability</h3>
<p>To the extent permitted under applicable law, the Company shall not be liable for unauthorized access beyond its reasonable control or any indirect or consequential damages arising from data usage.</p>

<h3>🔹 13. Amendments to Policy</h3>
<p>The Company reserves the right to update or modify this Policy at any time. Revised Policy shall be effective upon publication on the website.</p>

<h3>🔹 14. Governing Law &amp; Jurisdiction</h3>
<p>This Policy shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Delhi NCR, India.</p>

<h3>🔹 15. Contact Information</h3>
<p><strong>Namo Gange Wellness Pvt. Ltd.</strong><br/>
📧 Email: <a href="mailto:info@namogangewellness.com">info@namogangewellness.com</a><br/>
📞 Phone: <a href="tel:+91-9654900525">+91-9654900525</a><br/>
🌐 Website: <a href="https://namogangewellness.com" target="_blank">namogangewellness.com</a></p>
`
    },
    {
        page: 'refund-policy',
        title: 'Refund & Cancellation Policy – IH&WE 2026',
        content: `
<h2>Refund &amp; Cancellation Policy</h2>
<h2>9th Edition of International Health &amp; Wellness Expo 2026 (IH&WE – Global Edition) &amp; Associated Programs</h2>
<p><strong>Organised by:</strong> Namo Gange Wellness Pvt. Ltd.<br/>
<strong>In Association With:</strong><br/>
International Council of AYUSH (ICOA) – (Buyer-Seller Meet)<br/>
Namo Gange Trust – (Arogya Sanghosthi / Conferences)</p>

<h3>🔹 1. Scope of Policy</h3>
<p>This Refund &amp; Cancellation Policy governs all payments made towards:</p>
<ul>
  <li>Exhibition Stall Booking</li>
  <li>Sponsorship Packages</li>
  <li>Buyer / Seller Registration</li>
  <li>Delegate Registration</li>
  <li>Seminar / Conference Participation</li>
  <li>ICOA Buyer Membership</li>
</ul>
<p>This Policy forms an integral part of the Terms &amp; Conditions and shall be binding on all Participants.</p>

<h3>🔹 2. General Refund Policy</h3>
<p>All payments made to Namo Gange Wellness Pvt. Ltd. are <strong>strictly non-refundable and non-transferable</strong>. By making payment, the Participant acknowledges and agrees to this policy.</p>

<h3>🔹 3. No Refund Scenarios</h3>
<p>No refund shall be provided under any circumstances, including but not limited to:</p>
<ul>
  <li>Cancellation by the Participant for any reason</li>
  <li>Non-attendance (no-show)</li>
  <li>Partial participation or early exit</li>
  <li>Change in business plans, priorities, or schedule</li>
  <li>Dissatisfaction with business outcomes or networking results</li>
</ul>

<h3>🔹 4. Event Rescheduling / Modification</h3>
<p>The Organiser reserves the right to reschedule, modify, or change venue or format of the Event. In such cases, the registration/booking shall remain valid for the revised event and no refund shall be applicable.</p>

<h3>🔹 5. Event Cancellation by Organiser</h3>
<p>In rare circumstances, if the Event is cancelled, the Organiser may, at its sole discretion, offer credit for future events or provide alternative participation benefits. Refunds, if any, shall be at the sole discretion of the Organiser and not a matter of right.</p>

<h3>🔹 6. Payment Errors / Duplicate Transactions</h3>
<p>In case of duplicate payment, excess payment, or technical error during transaction, the Participant must notify within <strong>7 (seven) days</strong> of the transaction. After verification, eligible excess amount may be adjusted or refunded.</p>

<h3>🔹 7. Refund Processing (If Applicable)</h3>
<p>Approved refunds (if any) shall be processed within a reasonable time frame through the original mode of payment, subject to banking norms.</p>

<h3>🔹 8. Non-Transferability</h3>
<p>Registration, booking, or membership is non-transferable. Substitution of participant is not allowed without prior written approval.</p>

<h3>🔹 9. Role of Associate Partners</h3>
<p>ICOA and Namo Gange Trust act only as facilitation / knowledge partners. They shall not be responsible for refunds, payment disputes, or financial claims. All refund-related matters shall be handled solely by the Organiser.</p>

<h3>🔹 10. Chargebacks &amp; Disputes</h3>
<p>Initiating a chargeback without valid grounds shall be treated as breach of agreement. The Organiser reserves the right to suspend participation, recover dues through legal means, and initiate appropriate legal proceedings.</p>

<h3>🔹 11. Force Majeure</h3>
<p>No refund or liability shall arise due to natural disasters, government restrictions, pandemic, or unforeseen circumstances.</p>

<h3>🔹 12. Limitation of Liability</h3>
<p>The Organiser shall not be liable for indirect or consequential losses, business loss, missed opportunities, or damages.</p>

<h3>🔹 13. Governing Law &amp; Jurisdiction</h3>
<p>This Policy shall be governed by the laws of India. Subject to exclusive jurisdiction of Courts in Delhi NCR, India.</p>

<hr/>
<p><strong>Contact:</strong> <a href="mailto:info@namogangewellness.com">info@namogangewellness.com</a> | <a href="tel:+91-9654900525">+91-9654900525</a> | <a href="https://namogangewellness.com" target="_blank">namogangewellness.com</a></p>
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
            console.log(`✅ Seeded: ${policy.title}`);
        }

        console.log('\n🎉 All 3 policies seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding policies:', error);
        process.exit(1);
    }
};

seed();
