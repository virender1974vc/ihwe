const axios = require('axios');

/**
 * WhatsApp Service - Send WhatsApp messages via OPUS API
 * OPUS API Documentation: https://api.opustechnology.in/wapp/v2/api/send
 */

// Configuration
const OPUS_API_KEY = process.env.OPUS_API_KEY;
const OPUS_API_URL = 'https://api.opustechnology.in/wapp/v2/api/send';
const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED === 'true' || !!OPUS_API_KEY;

/**
 * Format phone number for WhatsApp
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (default: India +91)
    if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }
    
    // Remove leading 0 if present after country code
    if (cleaned.startsWith('910')) {
        cleaned = '91' + cleaned.substring(3);
    }
    
    return cleaned;
};

/**
 * Send WhatsApp message via OPUS API
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<object>}
 */
const sendMessage = async (to, message) => {
    try {
        // If WhatsApp is disabled, just log and return success
        if (!WHATSAPP_ENABLED || !OPUS_API_KEY) {
            console.log('📱 WhatsApp (Disabled/Preview):', { to, message: message.substring(0, 100) + '...' });
            return {
                success: true,
                provider: 'none',
                message: 'WhatsApp is disabled or API key not configured'
            };
        }

        const formattedMobile = formatPhoneNumber(to);
        if (!formattedMobile) {
            throw new Error('Invalid phone number');
        }

        const url = `${OPUS_API_URL}?apikey=${OPUS_API_KEY}&mobile=${formattedMobile}&msg=${encodeURIComponent(message)}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await axios.get(url, {
            signal: controller.signal,
            timeout: 15000
        });

        clearTimeout(timeoutId);

        // OPUS API returns success in different formats
        const isSuccess = response.data?.status === true || 
                          response.data?.status === 'success' ||
                          response.data?.success === true ||
                          response.status === 200;

        if (isSuccess) {
            return {
                success: true,
                messageId: response.data?.messageId || response.data?.id || `opus_${Date.now()}`,
                provider: 'opus',
                response: response.data
            };
        } else {
            throw new Error(response.data?.message || response.data?.error || 'OPUS API returned failure');
        }
    } catch (error) {
        console.error('OPUS WhatsApp Error:', error.message);
        
        // Return partial success for logging purposes
        return {
            success: false,
            provider: 'opus',
            error: error.message,
            phone: to
        };
    }
};

/**
 * Send Payment Delay Warning via WhatsApp
 * @param {string} phone - Recipient phone number
 * @param {object} data - Template data
 * @param {string} customMessage - Optional custom message
 * @returns {Promise<object>}
 */
const sendPaymentDelayWarning = async (phone, data, customMessage = null) => {
    const message = customMessage || `⚠️ *Payment Reminder*

Dear ${data.contactPerson || 'Customer'},

Your payment for *${data.eventName || 'Exhibition'}* is overdue by ${data.daysOverdue || 0} days.

📋 *Payment Details:*
• Registration: ${data.registrationId || 'N/A'}
• Stall: ${data.stallNo || 'N/A'}
• Balance: ₹${(data.balanceAmount || 0).toLocaleString('en-IN')}
• Penalty: ₹${(data.penaltyAmount || 0).toLocaleString('en-IN')}
• *Total: ₹${(data.totalPayable || 0).toLocaleString('en-IN')}*

💳 *Pay Now:* ${data.paymentLink || 'Contact support'}

📞 Contact: ${data.supportPhone || 'Support'}

_This is an automated message from ${data.companyName || 'Exhibition'}_`;

    return await sendMessage(phone, message);
};

/**
 * Send Payment Confirmation via WhatsApp
 * @param {string} phone - Recipient phone number
 * @param {object} data - Template data
 * @returns {Promise<object>}
 */
const sendPaymentConfirmation = async (phone, data) => {
    const message = `✅ *Payment Received*

Dear ${data.contactPerson || 'Customer'},

Your payment has been successfully received.

📋 *Payment Details:*
• Registration: ${data.registrationId || 'N/A'}
• Amount Paid: ₹${(data.amountPaid || 0).toLocaleString('en-IN')}
• Payment ID: ${data.transactionId || 'N/A'}
• Date: ${new Date().toLocaleDateString('en-IN')}

Thank you for your payment!

_${data.companyName || 'Exhibition'}_`;

    return await sendMessage(phone, message);
};

/**
 * Send Booking Confirmation via WhatsApp
 * @param {string} phone - Recipient phone number
 * @param {object} data - Template data
 * @returns {Promise<object>}
 */
const sendBookingConfirmation = async (phone, data) => {
    const message = `🎉 *Booking Confirmed*

Dear ${data.contactPerson || 'Customer'},

Your booking for *${data.eventName || 'Exhibition'}* has been confirmed!

📋 *Booking Details:*
• Registration ID: ${data.registrationId || 'N/A'}
• Stall No: ${data.stallNo || 'N/A'}
• Stall Type: ${data.stallType || 'N/A'}
• Event: ${data.eventName || 'N/A'}

Thank you for registering!

_${data.companyName || 'Exhibition'}_`;

    return await sendMessage(phone, message);
};

/**
 * Send Installment Due Reminder via WhatsApp
 * @param {string} phone - Recipient phone number
 * @param {object} data - Template data
 * @returns {Promise<object>}
 */
const sendInstallmentReminder = async (phone, data) => {
    const message = `📅 *Installment Due Reminder*

Dear ${data.contactPerson || 'Customer'},

Your ${data.installmentLabel || 'installment'} payment is due.

📋 *Payment Details:*
• Registration: ${data.registrationId || 'N/A'}
• Installment: ${data.installmentLabel || 'N/A'}
• Amount Due: ₹${(data.dueAmount || 0).toLocaleString('en-IN')}
• Due Date: ${data.dueDate || 'N/A'}

💳 *Pay Now:* ${data.paymentLink || 'Contact support'}

_${data.companyName || 'Exhibition'}_`;

    return await sendMessage(phone, message);
};

/**
 * Send Custom WhatsApp Message
 * @param {string} phone - Recipient phone number
 * @param {string} message - Custom message
 * @returns {Promise<object>}
 */
const sendCustomMessage = async (phone, message) => {
    return await sendMessage(phone, message);
};

module.exports = {
    sendMessage,
    sendPaymentDelayWarning,
    sendPaymentConfirmation,
    sendBookingConfirmation,
    sendInstallmentReminder,
    sendCustomMessage,
    formatPhoneNumber
};
