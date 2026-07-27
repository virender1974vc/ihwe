const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix "Amount to Collect" UI labels
const oldCollectValue = `const totalAmount = formData.participation.total;
                                                const amt = p ? Math.round(totalAmount * (p.percentage / 100)) : totalAmount;`;
                                                
const newCollectValue = `const netTotal = formData.financeBreakdown.netPayable;
                                                const amt = p ? Math.round(netTotal * (p.percentage / 100)) : netTotal;`;

content = content.replaceAll(oldCollectValue, newCollectValue);

// Fix "Balance Pending" UI labels (already handles totalAmount - amt, 
// so as long as amt is based on netTotal, it will be correct IF we use netTotal there too)
const oldBalanceValue = `const totalAmount = formData.participation.total;
                                                 const amt = p ? Math.round(totalAmount * (p.percentage / 100)) : totalAmount;
                                                 return \`\${formData.participation.currency} \${(totalAmount - amt).toLocaleString()}\`;`;

const newBalanceValue = `const netTotal = formData.financeBreakdown.netPayable;
                                                 const amt = p ? Math.round(netTotal * (p.percentage / 100)) : netTotal;
                                                 return \`\${formData.participation.currency} \${(netTotal - amt).toLocaleString()}\`;`;

content = content.replaceAll(oldBalanceValue, newBalanceValue);

fs.writeFileSync(filePath, content);
console.log('Admin UI Labels fixed to use Net Payable.');
