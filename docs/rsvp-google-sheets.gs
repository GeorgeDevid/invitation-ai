/**
 * George & Tess — RSVP → Google Sheets
 *
 * Setup (about 3 minutes):
 *  1. Open https://sheets.new to create a Google Sheet (name it e.g. "George & Tess RSVPs").
 *  2. In the sheet: Extensions → Apps Script. Delete what is in the editor, paste this whole
 *     file, and click Save (the disk icon).
 *  3. Click Deploy → New deployment → the gear next to "Select type" → Web app.
 *       Description: RSVP      Execute as: Me      Who has access: Anyone
 *     Click Deploy, then Authorize access and allow it with your Google account
 *     (on "Google hasn't verified this app" choose Advanced → Go to … (unsafe); it is your own script).
 *  4. Copy the "Web app" URL (it ends in /exec) and put it in `rsvp.endpoint` in assets/js/config.js.
 *
 * Each reply becomes a row in the "RSVPs" tab: Submitted at · Full name · Guests · Reply ID.
 * If a guest changes their reply from the same phone or browser, their existing row is updated.
 * Opening the /exec URL in a browser shows {"ok":true,...} when the script is live.
 *
 * After editing this script later, use Deploy → Manage deployments → edit (pencil) → Version: New version,
 * so the URL stays the same.
 */
const SHEET_NAME = "RSVPs";
const HEADERS = ["Submitted at", "Full name", "Guests", "Reply ID"];

function doPost(e) {
  const p = (e && e.parameter) || {};
  const name = clean(p.name, 120);
  const guests = Math.min(Math.max(parseInt(p.guests, 10) || 1, 1), 20);
  const id = clean(p.replyId, 64);
  if (!name) return reply({ ok: false, error: "Please include your full name." });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet();
    const row = [new Date(), name, guests, id];
    const existing = id ? findRow(sheet, id) : 0;
    if (existing) sheet.getRange(existing, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);
    return reply({ ok: true, updated: existing > 0 });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return reply({ ok: true, service: "George & Tess RSVP" });
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME, 0);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#ece4f7");
    sheet.setFrozenRows(1);
    sheet.getRange("A:A").setNumberFormat("d mmm yyyy, h:mm am/pm");
    sheet.setColumnWidth(1, 180).setColumnWidth(2, 240).setColumnWidth(3, 70).setColumnWidth(4, 120);
  }
  return sheet;
}

function findRow(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const ids = sheet.getRange(2, 4, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}

// Trim, cap length, and stop text that starts like a formula (= + - @) from being run by the sheet.
function clean(v, max) {
  const s = String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
