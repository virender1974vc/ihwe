const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'admin', 'src', 'pages', 'BookAStand.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add to initial formData
content = content.replace(/paymentType: 'full',/, "paymentPlanType: 'full', paymentPlanLabel: 'Full Payment (100%)',");

// Update Initial Data Fetch to set first plan
const initialFetchMarker = "setFormData(prev => ({ ...prev, eventId: eRes.data.data[0]._id }));";
const newInitialFetch = `setFormData(prev => {
                        const selEvent = eRes.data.data[0];
                        const firstPlan = (selEvent?.paymentPlans && selEvent.paymentPlans.length > 0) ? selEvent.paymentPlans[0].id : 'full';
                        const firstLabel = (selEvent?.paymentPlans && selEvent.paymentPlans.length > 0) ? selEvent.paymentPlans[0].label : 'Full Payment';
                        return { ...prev, eventId: selEvent._id, paymentPlanType: firstPlan, paymentPlanLabel: firstLabel };
                    });`;
content = content.replace(initialFetchMarker, newInitialFetch);

// Update Event Change logic
const eventChangeSelector = "setSelectedEventId(eRes.data.data[0]._id);";
// Wait, I should also update when user manually changes event if that exists.
// Actually lines 87-117 is the initial load. 

// Update handleSubmit to calculate amountPaid
const handleSubmitStart = 'const finalData = {';
const handleSubmitEnd = '};';
// I'll replace the whole finalData block

const findFinalData = /const finalData = \{[\s\S]+?filledBy: currentUser\?\.username \|\| 'Admin',[\s\S]+?amountPaid: 0,[\s\S]+?balanceAmount: formData\.participation\.total,[\s\S]+?status: 'pending',[\s\S]+?paymentMode: 'manual'[\s\S]+?\};/;

const newFinalData = `const currentEvent = events.find(e => e._id === selectedEventId);
            const selectedPlan = (currentEvent?.paymentPlans || []).find(p => p.id === formData.paymentPlanType);
            
            const totalWithGst = formData.participation.total;
            let paidAmount = totalWithGst; // Default for full
            if (selectedPlan) {
                paidAmount = Math.round(totalWithGst * (Number(selectedPlan.percentage) / 100));
            }

            const finalData = {
                ...formData,
                eventId: selectedEventId,
                filledBy: currentUser?.username || 'Admin',
                amountPaid: paidAmount,
                balanceAmount: totalWithGst - paidAmount,
                status: paidAmount > 0 ? 'advance-paid' : 'pending',
                paymentMode: 'manual'
            };`;

content = content.replace(findFinalData, newFinalData);

fs.writeFileSync(filePath, content);
console.log('BookAStand.jsx Logic updated.');
