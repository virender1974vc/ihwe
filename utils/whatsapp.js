const sendWhatsAppOTP = async (mobile, otp) => {
    try {
        const msg = `Your OTP for IHWE Contact Verification is: ${otp}. Please do not share this with anyone.`;
        const url = `http://api.opustechnology.in/wapp/v2/api/send?apikey=${process.env.OPUS_API_KEY}&mobile=${mobile}&msg=${encodeURIComponent(msg)}`;
        
        // Add a timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        console.log('WhatsApp API Response:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error sending WhatsApp OTP:', error);
        return { success: false, error: error.message || 'Failed to connect to WhatsApp API' };
    }
};

module.exports = { sendWhatsAppOTP };
