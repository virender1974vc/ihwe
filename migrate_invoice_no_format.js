const mongoose = require("mongoose");
require("dotenv").config();

const APPLY = process.argv.includes("--apply");
const WITH_LOGS = process.argv.includes("--with-logs");

// NGW/INV/YY-YY/XXX -> NGW/YY-YY/XXX ; anything else returns null.
const toNewFormat = (value) => {
  const parts = String(value || "").split("/");
  if (parts.length !== 4) return null;
  if (parts[0] !== "NGW" || parts[1] !== "INV") return null;
  return [parts[0], parts[2], parts[3]].join("/");
};

// Rewrites every old-format number found inside free text. Deliberately does
// NOT depend on the invoices still being in the old format, so --with-logs can
// be run later, on its own, after the invoices have already been renamed.
const rewriteOldNumbers = (text) => {
  const MARK = "NGW/INV/";
  const ALLOWED = "0123456789-/";
  let out = "";
  let i = 0;
  for (;;) {
    const at = text.indexOf(MARK, i);
    if (at < 0) { out += text.slice(i); return out; }
    out += text.slice(i, at);
    let j = at + MARK.length;
    while (j < text.length && ALLOWED.indexOf(text[j]) >= 0) j += 1;
    const token = text.slice(at, j);
    out += toNewFormat(token) || token;
    i = j;
  }
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI_MAIN);
  const db = mongoose.connection;
  const invoices = db.collection("invoices");

  console.log(APPLY ? "MODE: APPLY (writing)" : "MODE: DRY RUN (nothing is written)");
  console.log(WITH_LOGS ? "activitylogs: WILL be rewritten" : "activitylogs: left as-is (pass --with-logs to include)");
  console.log("");

  const all = await invoices.find({}).project({ invoice_no: 1, revisions: 1 }).toArray();
  const existingNumbers = new Set(all.map((d) => String(d.invoice_no || "")));

  const plan = [];
  const skipped = [];
  const seenTargets = new Set();

  for (const doc of all) {
    const oldNo = String(doc.invoice_no || "");
    const newNo = toNewFormat(oldNo);
    if (!newNo) continue;
    if (existingNumbers.has(newNo)) {
      skipped.push({ oldNo, newNo, why: "target already exists in invoices" });
      continue;
    }
    if (seenTargets.has(newNo)) {
      skipped.push({ oldNo, newNo, why: "two invoices map to the same new number" });
      continue;
    }
    seenTargets.add(newNo);
    plan.push({ _id: doc._id, oldNo, newNo });
  }

  console.log("invoices to rename :", plan.length);
  plan.forEach((p) => console.log("   " + p.oldNo + "   ->   " + p.newNo));
  if (skipped.length) {
    console.log("");
    console.log("!! SKIPPED (needs a human decision):", skipped.length);
    skipped.forEach((s) => console.log("   " + s.oldNo + "   ->   " + s.newNo + "   [" + s.why + "]"));
  }
  if (!plan.length && !WITH_LOGS) {
    console.log("");
    console.log("No invoices left in the old format. Nothing to do.");
    console.log("(activitylogs may still carry old numbers - re-run with --with-logs to check.)");
    await mongoose.disconnect();
    return;
  }

  const renameMap = new Map(plan.map((p) => [p.oldNo, p.newNo]));

  // --- linked references, counted before any write so the dry run is truthful
  const payments = db.collection("payments");
  const payMatches = await payments.find({ ex_no: { $in: Array.from(renameMap.keys()) } })
    .project({ ex_no: 1 }).toArray();
  console.log("");
  console.log("payments.ex_no rows to update :", payMatches.length);
  payMatches.forEach((p) => console.log("   " + p.ex_no + "   ->   " + renameMap.get(String(p.ex_no))));

  let revisionDocs = 0;
  for (const doc of all) {
    const revs = Array.isArray(doc.revisions) ? doc.revisions : [];
    if (revs.some((r) => r && r.snapshot && renameMap.has(String(r.snapshot.invoice_no)))) revisionDocs++;
  }
  console.log("invoices with revision snapshots to update :", revisionDocs);

  const activitylogs = db.collection("activitylogs");
  let logMatches = 0;
  const logDocs = await activitylogs.find({}).project({ details: 1 }).toArray();
  const logsToFix = [];
  for (const log of logDocs) {
    const text = String(log.details || "");
    const next = rewriteOldNumbers(text);
    if (next !== text) { logMatches++; logsToFix.push({ _id: log._id, details: next }); }
  }
  console.log("activitylogs.details rows containing an old number :", logMatches);

  if (!APPLY) {
    console.log("");
    console.log("Dry run only. Re-run with --apply to write these changes.");
    await mongoose.disconnect();
    return;
  }

  console.log("");
  console.log("--- applying ---");

  let renamed = 0;
  for (const p of plan) {
    const doc = all.find((d) => String(d._id) === String(p._id));
    const revs = Array.isArray(doc.revisions) ? doc.revisions : [];
    const update = { invoice_no: p.newNo };
    if (revs.length) {
      update.revisions = revs.map((r) => {
        if (!r || !r.snapshot) return r;
        const mapped = renameMap.get(String(r.snapshot.invoice_no));
        if (!mapped) return r;
        return Object.assign({}, r, { snapshot: Object.assign({}, r.snapshot, { invoice_no: mapped }) });
      });
    }
    await invoices.updateOne({ _id: p._id }, { $set: update });
    renamed++;
  }
  console.log("invoices renamed        :", renamed);

  let payUpdated = 0;
  for (const [oldNo, newNo] of renameMap) {
    const res = await payments.updateMany({ ex_no: oldNo }, { $set: { ex_no: newNo } });
    payUpdated += res.modifiedCount;
  }
  console.log("payments.ex_no updated  :", payUpdated);

  if (WITH_LOGS) {
    let logUpdated = 0;
    for (const l of logsToFix) {
      const res = await activitylogs.updateOne({ _id: l._id }, { $set: { details: l.details } });
      logUpdated += res.modifiedCount;
    }
    console.log("activitylogs updated    :", logUpdated);
  } else {
    console.log("activitylogs            : skipped (" + logMatches + " rows still carry the old number)");
  }

  console.log("");
  console.log("Done.");
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error("ERR", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
