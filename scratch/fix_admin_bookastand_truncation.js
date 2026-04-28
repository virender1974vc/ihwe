const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Broken part around line 285
const brokenPart = `primaryCategory: '',
            Swal.fire('Error', error.response?.data?.message || 'Submission failed. Please try again.', 'error');
        } finally {`;

const fixedPart = `primaryCategory: '',
                        subCategory: '',
                        referredBy: 'Direct Website',
                        spokenWith: '',
                        filledBy: 'Admin',
                        status: 'pending',
                        paymentMode: 'manual',
                        paymentPlanType: 'full',
                        paymentPlanLabel: 'Full Payment (100%)',
                        amountPaid: 0,
                        balanceAmount: 0
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Submission failed. Please try again.', 'error');
        } finally {`;

if (content.includes(brokenPart)) {
    content = content.replace(brokenPart, fixedPart);
    fs.writeFileSync(filePath, content);
    console.log('BookAStand.jsx Restoration fixed.');
} else {
    console.log('Broken part not found. Checking variant.');
    // Check if whitespace is different
    const variant = `primaryCategory: '',\n            Swal.fire('Error'`;
    if (content.includes(variant)) {
         // handle variant if needed
    }
}
