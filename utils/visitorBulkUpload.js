const XLSX = require("xlsx");
const qrcode = require("qrcode");

const MAX_VISITOR_IMPORT_ROWS = 100;
const MAX_VISITOR_IMPORT_FILE_SIZE = 5 * 1024 * 1024;
const EXCEL_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream",
]);

const visitorExcelFileFilter = (req, file, cb) => {
  const extensionAllowed = /\.(xlsx|xls)$/i.test(file.originalname || "");
  if (!extensionAllowed || !EXCEL_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("Only .xlsx or .xls files are allowed.");
    error.statusCode = 415;
    return cb(error);
  }
  return cb(null, true);
};

const visitorUploadLimits = { fileSize: MAX_VISITOR_IMPORT_FILE_SIZE, files: 1 };

const visitorUploadErrorHandler = (error, req, res, next) => {
  if (!error) return next();
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "Excel file must be 5 MB or smaller." });
  }
  return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Unable to upload Excel file." });
};

const normalizeHeader = (value) => String(value || "")
  .replace(/^\uFEFF/, "")
  .trim()
  .replace(/[\s_-]+/g, "")
  .toLowerCase();

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeMobile = (value) => String(value || "").replace(/\.0$/, "").replace(/[^\d+]/g, "").trim();
const hasValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parseList = (value) => Array.isArray(value)
  ? value.map((item) => String(item).trim()).filter(Boolean)
  : String(value || "").split(/[,;|]/).map((item) => item.trim()).filter(Boolean);

const normalizeBooleanFields = (data, model) => {
  const normalized = { ...data };

  model.schema.eachPath((path, schemaType) => {
    if (schemaType.instance !== "Boolean" || path.includes(".") || !(path in normalized)) return;

    const value = normalized[path];
    if (value === null || value === undefined || (typeof value === "string" && !value.trim())) {
      delete normalized[path];
      return;
    }

    if (typeof value !== "string") return;
    const booleanValue = value.trim().toLowerCase();
    if (["true", "yes", "y", "1", "on"].includes(booleanValue)) {
      normalized[path] = true;
      return;
    }
    if (["false", "no", "n", "0", "off"].includes(booleanValue)) {
      normalized[path] = false;
      return;
    }
    throw new Error(`invalid value for ${path}; use Yes/No, True/False, or 1/0.`);
  });

  return normalized;
};

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = { status: "fulfilled", value: await worker(items[index], index) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

const readWorkbook = (file) => {
  const workbook = file.buffer
    ? XLSX.read(file.buffer, { type: "buffer" })
    : XLSX.readFile(file.path);
  if (!workbook.SheetNames.length) throw new Error("Excel workbook has no sheets.");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
  if (!matrix.length) return { headers: [], rows: [] };
  const headers = matrix[0].map((header) => String(header || "").trim());
  const rows = matrix.slice(1)
    .filter((cells) => cells.some((value) => String(value || "").trim() !== ""))
    .map((cells) => Object.fromEntries(headers.map((header, index) => [normalizeHeader(header), cells[index] ?? ""])));
  return { headers, rows };
};

const buildCanonicalRow = (rawRow, fields) => Object.fromEntries(
  Object.entries(fields).map(([field, aliases]) => {
    const keys = [field, ...aliases].map(normalizeHeader);
    const key = keys.find((candidate) => Object.prototype.hasOwnProperty.call(rawRow, candidate));
    return [field, key ? rawRow[key] : ""];
  }),
);

const formatDuplicateMessage = (rowNumber, fields, location) =>
  `Row ${rowNumber}: duplicate ${fields.join(" and ")} ${location}.`;

async function validateRows({ rows, model, fields, requiredFields, transformRow }) {
  const errors = [];
  const prepared = [];
  const emails = new Map();
  const mobiles = new Map();

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const row = buildCanonicalRow(rawRow, fields);
    row.email = normalizeEmail(row.email);
    row.mobile = normalizeMobile(row.mobile);

    const missing = requiredFields.filter((field) => !String(row[field] || "").trim());
    if (missing.length) errors.push(`Row ${rowNumber}: missing required field(s): ${missing.join(", ")}.`);
    if (row.email && !hasValidEmail(row.email)) errors.push(`Row ${rowNumber}: invalid email address.`);

    if (row.email) {
      if (emails.has(row.email)) errors.push(formatDuplicateMessage(rowNumber, ["email"], `in row ${emails.get(row.email)}`));
      else emails.set(row.email, rowNumber);
    }
    if (row.mobile) {
      if (mobiles.has(row.mobile)) errors.push(formatDuplicateMessage(rowNumber, ["mobile"], `in row ${mobiles.get(row.mobile)}`));
      else mobiles.set(row.mobile, rowNumber);
    }

    try {
      prepared.push({ rowNumber, data: normalizeBooleanFields(transformRow(row, { parseList }), model) });
    } catch (error) {
      errors.push(`Row ${rowNumber}: ${error.message}`);
    }
  });

  if (emails.size || mobiles.size) {
    const existing = await model.find({
      $or: [
        ...(emails.size ? [{ email: { $in: [...emails.keys()] } }] : []),
        ...(mobiles.size ? [{ mobile: { $in: [...mobiles.keys()] } }] : []),
      ],
    }).select("email mobile").lean();
    existing.forEach((visitor) => {
      const email = normalizeEmail(visitor.email);
      const mobile = normalizeMobile(visitor.mobile);
      if (email && emails.has(email)) errors.push(formatDuplicateMessage(emails.get(email), ["email"], "in existing visitor records"));
      if (mobile && mobiles.has(mobile)) errors.push(formatDuplicateMessage(mobiles.get(mobile), ["mobile"], "in existing visitor records"));
    });
  }

  return { errors: [...new Set(errors)], prepared };
}

async function processVisitorBulkUpload({
  req,
  res,
  model,
  registrationType,
  fields,
  requiredFields,
  transformRow,
  generateRegistrationId,
  buildNotificationData,
  sendNotification,
  logActivity,
  activityLabel,
}) {
  if (!req.file) return res.status(400).json({ success: false, message: "Excel file is required." });

  let parsed;
  try {
    parsed = readWorkbook(req.file);
  } catch (error) {
    return res.status(400).json({ success: false, message: `Unable to read Excel file: ${error.message}` });
  }

  if (!parsed.rows.length) return res.status(400).json({ success: false, message: "Excel file has no data rows." });
  if (parsed.rows.length > MAX_VISITOR_IMPORT_ROWS) {
    return res.status(413).json({ success: false, message: `A maximum of ${MAX_VISITOR_IMPORT_ROWS} rows can be imported at once.` });
  }

  const { errors, prepared } = await validateRows({ rows: parsed.rows, model, fields, requiredFields, transformRow });
  if (errors.length) {
    return res.status(422).json({
      success: false,
      message: "Nothing was imported. Fix the listed validation errors and upload again.",
      totalRows: parsed.rows.length,
      importedCount: 0,
      errors,
    });
  }

  const saveResults = await runWithConcurrency(prepared, 8, async (item) => {
      const registrationId = await generateRegistrationId(registrationType);
      const siteUrl = (process.env.SITE_URL || "https://ihwe.in").replace(/\/$/, "");
      const qrCode = await qrcode.toDataURL(`${siteUrl}/visitor?id=${encodeURIComponent(registrationId)}`);
      return model.create({
        ...item.data,
        registrationId,
        qrCode,
        created_by: req.user?.username || req.user?.name || "Bulk Upload",
      });
  });
  const savedVisitors = saveResults.filter((result) => result.status === "fulfilled").map((result) => result.value);
  const saveFailures = saveResults.filter((result) => result.status === "rejected");
  if (saveFailures.length) {
    const insertedIds = savedVisitors.map((visitor) => visitor._id);
    if (insertedIds.length) await model.deleteMany({ _id: { $in: insertedIds } });
    return res.status(500).json({
      success: false,
      message: "Import failed while saving. All rows created by this upload were rolled back.",
      importedCount: 0,
      error: saveFailures[0].reason?.message || "Unknown database error",
    });
  }

  const notificationResults = await runWithConcurrency(savedVisitors, 10, async (visitor) => {
    const sent = await sendNotification(buildNotificationData(visitor));
    if (sent === false) throw new Error("Notification service returned an unsuccessful result.");
  });
  const notificationFailedCount = notificationResults.filter((result) => result.status === "rejected").length;

  if (logActivity) {
    await logActivity(req, "Action", "Visitor Registrations", `Bulk uploaded ${savedVisitors.length} ${activityLabel} visitors; ${notificationFailedCount} notification(s) failed.`);
  }

  return res.status(201).json({
    success: true,
    message: `Successfully imported all ${savedVisitors.length} visitors.`,
    totalRows: parsed.rows.length,
    importedCount: savedVisitors.length,
    notificationSentCount: savedVisitors.length - notificationFailedCount,
    notificationFailedCount,
    warnings: notificationFailedCount ? [`${notificationFailedCount} visitor notification(s) failed and can be resent from the visitor list.`] : [],
  });
}

module.exports = {
  visitorExcelFileFilter,
  visitorUploadLimits,
  visitorUploadErrorHandler,
  normalizeBooleanFields,
  processVisitorBulkUpload,
};
