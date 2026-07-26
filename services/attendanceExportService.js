const ExcelJS = require('exceljs');

const COLORS = {
    navy: 'FF102A43', green: 'FF087F5B', emerald: 'FF12B886', gold: 'FFF2C94C',
    blue: 'FF2563EB', visitor: 'FF0EA5E9', buyer: 'FFF59F00', exhibitor: 'FF7C3AED',
    white: 'FFFFFFFF', light: 'FFF4F7FB', ink: 'FF172B4D', muted: 'FF64748B'
};

const clean = value => value == null ? '' : Array.isArray(value) ? value.join(', ') : String(value);
const dateLabel = value => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : clean(value);
};
const timeLabel = value => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
};

function titleRow(sheet, title, subtitle, columns) {
    sheet.mergeCells(1, 1, 1, columns);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 18, color: { argb: COLORS.white } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(1).height = 34;
    sheet.mergeCells(2, 1, 2, columns);
    const subCell = sheet.getCell(2, 1);
    subCell.value = subtitle;
    subCell.font = { italic: true, size: 10, color: { argb: COLORS.muted } };
    sheet.getRow(2).height = 22;
}

function addTableSheet(workbook, name, title, subtitle, rows, columns, accent = COLORS.green) {
    const sheet = workbook.addWorksheet(name.slice(0, 31), { views: [{ state: 'frozen', ySplit: 4 }] });
    titleRow(sheet, title, subtitle, columns.length);
    const header = sheet.getRow(4);
    columns.forEach((column, index) => {
        const cell = header.getCell(index + 1);
        cell.value = column.header;
        cell.font = { bold: true, color: { argb: COLORS.white } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accent } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        sheet.getColumn(index + 1).width = column.width || 18;
    });
    header.height = 28;
    rows.forEach((item, rowIndex) => {
        const row = sheet.getRow(rowIndex + 5);
        columns.forEach((column, columnIndex) => {
            const cell = row.getCell(columnIndex + 1);
            cell.value = column.value(item, rowIndex);
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.border = { bottom: { style: 'hair', color: { argb: 'FFD9E2EC' } } };
        });
        if (rowIndex % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light } };
        row.height = 22;
    });
    sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: Math.max(4, rows.length + 4), column: columns.length } };
    sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    return sheet;
}

const recordColumns = [
    { header: '#', width: 7, value: (_, i) => i + 1 },
    { header: 'Event Day', width: 16, value: r => dateLabel(r.eventDay) },
    { header: 'Check-in Time', width: 16, value: r => timeLabel(r.markedAt) },
    { header: 'Type', width: 14, value: r => clean(r.subjectType).toUpperCase() },
    { header: 'Registration Type', width: 22, value: r => clean(r.subjectSubType).replaceAll('-', ' ') },
    { header: 'Attendance Kind', width: 18, value: r => clean(r.attendanceKind || 'registration') },
    { header: 'Pass Type', width: 15, value: r => clean(r.passType) },
    { header: 'Registration ID', width: 24, value: r => clean(r.registrationId) },
    { header: 'Name', width: 26, value: r => clean(r.name) },
    { header: 'Company', width: 30, value: r => clean(r.company) },
    { header: 'Designation', width: 22, value: r => clean(r.designation) },
    { header: 'Email', width: 30, value: r => clean(r.email) },
    { header: 'Mobile', width: 18, value: r => clean(r.mobile) },
    { header: 'Gate', width: 12, value: r => clean(r.gate) },
    { header: 'Marked By', width: 18, value: r => clean(r.markedByName) },
    { header: 'Source', width: 12, value: r => clean(r.source).toUpperCase() }
];

async function createAttendanceWorkbook({ event, days, records, companies, filters }) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IHWE Attendance App';
    workbook.created = new Date();
    workbook.properties.date1904 = false;
    const scope = [filters.day && `Day: ${dateLabel(filters.day)}`, filters.type && `Type: ${filters.type}`, filters.subType && `Registration: ${filters.subType}`, filters.search && `Search: ${filters.search}`].filter(Boolean).join(' | ') || 'Overall exhibition attendance';
    const eventName = event?.name || event?.title || 'IHWE Exhibition';

    const summary = workbook.addWorksheet('Summary', { views: [{ state: 'frozen', ySplit: 4 }] });
    titleRow(summary, `${eventName} - Attendance Summary`, `${scope} | Generated ${new Date().toLocaleString('en-IN')}`, 6);
    const unique = new Set(records.map(r => r.subjectKey)).size;
    const summaryRows = [
        ['Total check-ins', records.length, 'Unique attendees', unique, 'Companies present', companies.length],
        ['Visitors', new Set(records.filter(r => r.subjectType === 'visitor').map(r => r.subjectKey)).size,
            'Buyers', new Set(records.filter(r => r.subjectType === 'buyer').map(r => r.subjectKey)).size,
            'Exhibitors', new Set(records.filter(r => r.subjectType === 'exhibitor' && r.attendanceKind !== 'pass').map(r => r.companyId || r.subjectKey)).size]
    ];
    summaryRows.forEach((values, index) => {
        const row = summary.getRow(index + 4);
        values.forEach((value, cellIndex) => {
            const cell = row.getCell(cellIndex + 1);
            cell.value = value;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cellIndex % 2 ? COLORS.light : COLORS.green } };
            cell.font = { bold: true, size: cellIndex % 2 ? 16 : 10, color: { argb: cellIndex % 2 ? COLORS.ink : COLORS.white } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });
        row.height = 42;
    });
    summary.columns.forEach(column => { column.width = 22; });
    addTableSheet(workbook, 'All Records', 'Complete Attendance Log', scope, records, recordColumns, COLORS.green);

    const selectedDayOnly = Boolean(filters.day);
    (selectedDayOnly ? [filters.day] : days).forEach((day, index) => {
        const dayRows = records.filter(record => clean(record.eventDay) === clean(day));
        addTableSheet(workbook, `Day ${index + 1}`, `${dateLabel(day)} Attendance`, `${dayRows.length} check-ins`, dayRows, recordColumns, index % 2 ? COLORS.blue : COLORS.emerald);
    });
    if (!filters.type) {
        [['visitor', 'Visitors', COLORS.visitor], ['buyer', 'Buyers', COLORS.buyer], ['exhibitor', 'Exhibitors', COLORS.exhibitor]].forEach(([type, label, color]) => {
            addTableSheet(workbook, label, `${label} Attendance`, scope, records.filter(r => r.subjectType === type), recordColumns, color);
        });
    }
    const companyColumns = [
        { header: '#', width: 7, value: (_, i) => i + 1 },
        { header: 'Company', width: 34, value: c => clean(c.name) },
        { header: 'Registration ID', width: 24, value: c => clean(c.registrationId) },
        { header: 'Company Days', width: 18, value: c => clean(c.days) },
        { header: 'Company Check-ins', width: 20, value: c => c.companyCheckIns || 0 },
        { header: 'Member Check-ins', width: 19, value: c => c.memberCheckIns || 0 },
        { header: 'Unique Members', width: 18, value: c => c.uniqueMembers || 0 },
        { header: 'Pass Types Used', width: 28, value: c => clean(c.passTypes) },
        { header: 'Last Check-in', width: 22, value: c => c.lastMarkedAt ? `${dateLabel(c.lastMarkedAt)} ${timeLabel(c.lastMarkedAt)}` : '' }
    ];
    addTableSheet(workbook, 'Companies', 'Company-wise Exhibitor Attendance', scope, companies, companyColumns, COLORS.exhibitor);
    return workbook;
}

module.exports = { createAttendanceWorkbook };
