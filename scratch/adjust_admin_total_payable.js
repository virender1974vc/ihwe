const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update the big Total Payable label at line 890 area
const target = `<p className="text-2xl font-black text-[#23471d]">{formData.participation.currency} {formData.participation.total?.toLocaleString()}</p>`;
const replacement = `<p className="text-2xl font-black text-[#23471d]">{formData.participation.currency} {formData.financeBreakdown.netPayable?.toLocaleString()}</p>`;

if (content.indexOf(target) !== -1) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Admin Total Payable shifted to Net Amount.');
} else {
    console.log('Target not found in Admin.');
}
