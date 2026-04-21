const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /primaryCategory: '',\s+Swal\.fire\('Error', error\.response\?\.data\?\.message \|\| 'Submission failed\. Please try again\.', 'error'\);\s+} finally {/;

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

if (regex.test(content)) {
    content = content.replace(regex, fixedPart);
    fs.writeFileSync(filePath, content);
    console.log('BookAStand.jsx Regex Restoration fixed.');
} else {
    console.log('Regex match failed.');
    // Try even looser
    const looseRegex = /primaryCategory: '',\s+Swal\.fire\('Error'/;
    if (looseRegex.test(content)) {
        console.log('Loose match found. Replacing...');
        content = content.replace(/primaryCategory: '',\s+Swal\.fire\('Error'[\s\S]+?} finally {/, fixedPart);
        fs.writeFileSync(filePath, content);
        console.log('Applied loose fix.');
    }
}
