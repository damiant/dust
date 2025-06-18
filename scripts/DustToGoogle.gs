/* 
This script exports events from Dust to a Google Sheet and a Google Calendar.
Author: Julia Chartove
Date: June 17, 2025

How to use this script:
1. Make a new Google Calendar and get the calendar ID
2. Make a new Google Sheet with a tab called Events (you can change this name in the Settings section below if you want)
3. Make sure the sheet and calendar are both in the right time zone (File -> Settings -> Time zone)
4. Go to "Extensions" on the sheet and add an Apps Script
5. Paste this file there
6. Change the User Settings section of this file to match your sheet and event
7. Make sure the script is also set to the right time zone (Project Settings -> Time zone)
8. Add Google Calendar API service under Services
9. Add a trigger to run updateEvents() once an hour (or however often you want)
10. Add a trigger to run fullSync() when the sheet changes
11 Run updateEvents() once to initialize
*/

/* ─────────────────────────  USER SETTINGS  ───────────────────────── */
const SHEET_NAME  = 'Events';                                       // tab name
const CALENDAR_ID = 'l7sve162251li59l4nkdcs9bk4@group.calendar.google.com';
const TZ          = 'America/New_York';                            // festival TZ
const URL = 'https://data.dust.events/firefly-2025/schedule.json'; // API endpoint (see https://dust.events/docs/Integrations/api)
// calendar window for this year’s event
const YEAR = new Date().getFullYear();
const CAL_START = new Date(YEAR,5,1);                       // 1 Jun
const CAL_END   = new Date(YEAR,7,31,23,59,59,999);         // 31 Aug

/* ─────────────────────  HELPER: row-unique key  ──────────────────── */
function makeRowKey(id, start) {
  const dt = (start instanceof Date) ? start : new Date(start);
  return `${id}_${dt.toISOString()}`;          // e.g. 13904_2025-07-01T16:30:00Z
}

/* ──────────────────────  HELPER: retry wrapper  ──────────────────── */
const MAX_RETRIES = 5;
function withRetry(fn) {
  let delay = 1000;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try { return fn(); }
    catch (err) {
      if (i === MAX_RETRIES - 1 || !/Rate.*Exceeded|quota/i.test(String(err))) throw err;
      Utilities.sleep(delay);
      delay *= 2;
    }
  }
}
const listEv   = (c,p)      => withRetry(() => Calendar.Events.list(c,p));
const insertEv = (c,obj)    => withRetry(() => Calendar.Events.insert(obj,c));
const updateEv = (c,id,obj) => withRetry(() => Calendar.Events.update(obj,c,id));
const removeEv = (c,id)     => withRetry(() => Calendar.Events.remove(c,id));

/* ──────────────  HELPER: signature (title|loc|start|end)  ────────── */
function sig(title, loc, start, end) {
  return [
    (title||'').trim().toLowerCase(),
    (loc  ||'').trim().toLowerCase(),
    start instanceof Date ? start.getTime() : new Date(start).getTime(),
    end   instanceof Date ? end.getTime()   : new Date(end).getTime()
  ].join('|');
}

/* ──────────────────────  FETCH EVENTS  ────────────────────── */
// use Triggers to run this every hour
function updateEvents() {
  try {
    // Fetch the schedule JSON from the Dust API
    const response = UrlFetchApp.fetch(URL, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      Logger.log(`Failed to fetch data: ${response.getResponseCode()}`);
      return;
    }
    const events = JSON.parse(response.getContentText());
    
    // Prepare header and data rows
    const rows = [['id','title','description','type','location','startTime','endTime']];
    for (const event of events) {
      // Validate start and end time
      const occ = event.occurrence || {};
      const start = occ.start_time;
      const end = occ.end_time;
      if (!start || !end) {
        // Skip events with missing times
        continue;
      }
      // Optionally check if dates are valid
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        continue;  // skip invalid dates
      }
      // Strip 'u-' prefix from UID for id column
      let id = event.uid || '';
      if (id.startsWith('u-')) {
        id = id.substring(2);
      }
      // Determine title, description, type, and location
      const title = event.title || '';
      const desc = event.description || '';
      const type = (event.event_type && event.event_type.label) || '';
      let location = event.location || '';
      if (!location) {
        location = event.other_location || '';
      }
      // Append row: [id, title, description, type, location, startTime, endTime]
      rows.push([id, title, desc, type, location, start, end]);
    }
    
    // Write to the 'Events' sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Events');
    if (!sheet) {
      sheet = ss.insertSheet('Events');  // create sheet if it doesn't exist
    }
    sheet.clearContents();  // clear previous data (preserves formatting)
    // Set the range to cover all rows and columns, and write values
    const numRows = rows.length;
    const numCols = rows[0].length;
    sheet.getRange(1, 1, numRows, numCols).setValues(rows);
  } catch (error) {
    Logger.log(`Error updating events: ${error}`);
  }
}

/* ──────────────────────  WRITE TO CALENDAR  ────────────────────── */
function syncSheetToCalendar() {

  // read the sheet and build lookup maps
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const rows  = sheet.getRange(2,1,sheet.getLastRow()-1,7).getValues();

  const rowByKey = new Map();      // row_key → rowObj
  const sig2key  = new Map();      // signature → row_key  (for legacy match)

  rows.forEach(([id, title, desc, , loc, start, end]) => {
    if (!(start instanceof Date) || !(end instanceof Date)) return;
    const key = makeRowKey(id, start);
    rowByKey.set(key, { id, title, desc, loc, start, end });
    sig2key.set(sig(title, loc, start, end), key);
  });

  const processed = new Set();       // row_keys already on calendar

  let page;
  do {
    const resp = listEv(CALENDAR_ID, {
      singleEvents: true,
      timeMin: CAL_START.toISOString(),
      timeMax: CAL_END.toISOString(),
      maxResults: 2500,
      pageToken: page
    });

    (resp.items||[]).forEach(ev => {
      if (ev.eventType && ev.eventType !== 'default') return;     // skip b’days
      const key = ev.extendedProperties?.private?.row_key || null;

      /* ❶ ─── duplicate-key guard: if we already kept one, delete this copy */
      if (key && processed.has(key)) {          // second event with same key
        removeEv(CALENDAR_ID, ev.id);
        return;
      }

      const evSig = sig(
        ev.summary,
        ev.location,
        ev.start.dateTime||ev.start.date,
        ev.end.dateTime  ||ev.end.date
      );

      // keyed copy
      if (key) {
        processed.add(key);
        const row = rowByKey.get(key);
        if (!row) {                            // row deleted → remove event
          removeEv(CALENDAR_ID, ev.id);
          return;
        }
        // update if row changed
        const dirty =
          ev.summary !== row.title ||
          ev.location !== row.loc ||
          ev.description !== row.desc ||
          new Date(ev.start.dateTime).getTime() !== row.start.getTime() ||
          new Date(ev.end.dateTime).getTime()   !== row.end.getTime();

        if (dirty) {
          ev.summary     = row.title;
          ev.location    = row.loc;
          ev.description = row.desc.replace(/\\n/g,'\n');
          ev.start.dateTime = row.start.toISOString();
          ev.end.dateTime   = row.end.toISOString();
          updateEv(CALENDAR_ID, ev.id, ev);
        }
        return;                                // done with this event
      }

      // legacy / manual copy (no row_key)
      const wantedKey = sig2key.get(evSig);

      if (wantedKey) {
        /* It matches a sheet row → claim it (add row_key) */
        if (processed.has(wantedKey)) {
          // keyed twin already exists → delete this duplicate
          removeEv(CALENDAR_ID, ev.id);
          return;
        }
        const row = rowByKey.get(wantedKey);
        ev.extendedProperties = ev.extendedProperties || {};
        ev.extendedProperties.private = ev.extendedProperties.private || {};
        ev.extendedProperties.private.row_key = wantedKey;
        ev.summary     = row.title;
        ev.location    = row.loc;
        ev.description = row.desc.replace(/\\n/g,'\n');
        updateEv(CALENDAR_ID, ev.id, ev);
        processed.add(wantedKey);
      }
      /* else: manual event that doesn’t correspond to a sheet row
               → leave it untouched */
    });

    page = resp.nextPageToken;
  } while (page);

  // any sheet row not yet processed -> insert 
  rowByKey.forEach((row, key) => {
    if (processed.has(key)) return;
    insertEv(CALENDAR_ID, {
      summary:     row.title,
      description: row.desc.replace(/\\n/g,'\n'),
      location:    row.loc,
      start: { dateTime: row.start.toISOString(), timeZone: TZ },
      end:   { dateTime: row.end.toISOString(),   timeZone: TZ },
      extendedProperties: { private: { row_key: key } }
    });
  });

  Logger.log('Sync done ⇒ sheet rows: %s  processed: %s  inserted: %s',
             rowByKey.size, processed.size, rowByKey.size - processed.size);
}

/* ───────────────  ONE-LINE ENTRY (for trigger)  ─────────────── */
// use Triggers to run this whenever sheet changes
function fullSync() { withRetry(syncSheetToCalendar); }


