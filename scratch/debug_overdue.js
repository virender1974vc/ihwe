require('dotenv').config();
const mongoose = require('mongoose');

const { getAccountsReceivable } = require('../controllers/accountsReceivableController');

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    const req = { query: {} };
    let payload = null;
    const res = {
        status(code) { this._code = code; return this; },
        json(obj) { payload = obj; return this; },
    };

    await getAccountsReceivable(req, res);

    const rows = payload?.data?.rows || [];
    const overdue = rows.filter(r => r.isOverdue && Number(r.outstanding) > 0);

    console.log('Total rows:', rows.length);
    console.log('Overdue rows:', overdue.length);

    const idCounts = {};
    overdue.forEach(r => { idCounts[r.id] = (idCounts[r.id] || 0) + 1; });
    const dupes = Object.entries(idCounts).filter(([, c]) => c > 1);
    console.log('Duplicate ids among overdue rows:', dupes);

    overdue.forEach(r => {
        console.log(JSON.stringify({
            id: r.id, docType: r.docType, invNo: r.invNo, client: r.client,
            companyId: r.companyId, outstanding: r.outstanding, dueDate: r.dueDate,
            overdueDays: r.overdueDays, status: r.status,
        }));
    });

    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
