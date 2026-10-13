/**
 * RSVP → Google Sheets
 *
 * 1. Create a Google Sheet, then open Extensions → Apps Script.
 * 2. Replace the editor contents with this file and click Save.
 * 3. Deploy → New deployment → type "Web app".
 *      Execute as: Me      Who has access: Anyone
 * 4. Copy the Web app URL into `rsvp.endpoint` in assets/js/config.js.
 *
 * Every reply lands as a new row in the "RSVPs" tab.
 */
const SHEET_NAME = "RSVPs";
const COLUMNS = ["submittedAt", "name", "contact", "attending", "guests", "events", "meal", "message"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
    const p = (e && e.parameter) || {};
    // Prefix values that a spreadsheet would treat as a formula.
    const safe = (v) => (/^[=+\-@]/.test(String(v)) ? "'" + v : String(v || "").slice(0, 2000));
    sheet.appendRow(COLUMNS.map((c) => safe(p[c])));
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
