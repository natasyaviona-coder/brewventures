/**
 * Brewventures — Google Sheets backend
 *
 * PASTE THIS INTO Extensions → Apps Script IN YOUR SHEET.
 * Change SECRET_TOKEN below to any random string — the Next.js app
 * must send the same value in its `SHEETS_SECRET` env var.
 *
 * Deploy: Deploy → New deployment → Type: Web app
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy the /exec URL Google gives you and set `SHEETS_WEBAPP_URL`.
 *
 * Sheet layout — three tabs must exist and be named exactly:
 *   Beans, Brews, Tastings
 * Headers are auto-created on first request.
 */

const SECRET_TOKEN = "CHANGE_ME_TO_A_RANDOM_STRING";

const BEAN_HEADERS = [
  "id", "name", "roaster", "origin", "process", "roastLevel",
  "purchaseDate", "price", "totalGrams", "remainingGrams",
  "tastingNotes", "personalNotes", "imageUrl",
  "altitude", "variety", "producer", "roastDate",
  "createdAt", "updatedAt",
];

const BREW_HEADERS = [
  "id", "beanId", "brewedAt", "method", "dose", "water",
  "grinder", "grindSize", "grindAdjustment", "pours",
  "waterTemp", "brewTimeSec", "notes",
  "createdAt", "updatedAt",
];

const TASTING_HEADERS = [
  "id", "brewId", "bitterness", "acidity", "sweetness", "body",
  "aroma", "aftertaste", "enjoyment", "flavorNotes", "comments",
  "createdAt", "updatedAt",
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (!body || body.secret !== SECRET_TOKEN) {
      return respond({ ok: false, error: "Unauthorized" });
    }
    const action = body.action;
    const data = body.data || {};
    const result = route(action, data);
    return respond({ ok: true, result });
  } catch (err) {
    return respond({ ok: false, error: String(err && err.message || err) });
  }
}

function respond(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function route(action, data) {
  switch (action) {
    case "getAll":         return getAll();
    case "createBean":     return createBean(data);
    case "updateBean":     return updateBean(data.id, data.data);
    case "deleteBean":     return deleteBean(data.id);
    case "createBrew":     return createBrew(data);
    case "updateBrew":     return updateBrew(data.id, data.data);
    case "deleteBrew":     return deleteBrew(data.id);
    case "duplicateBrew":  return duplicateBrew(data.id);
    case "upsertTasting":  return upsertTasting(data);
    case "deleteTasting":  return deleteTasting(data.id);
    default: throw new Error("Unknown action: " + action);
  }
}

/* ---------- sheet helpers ---------- */

function sheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  const firstRow = s.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = headers.every((h, i) => firstRow[i] === h);
  if (!hasHeaders) {
    s.getRange(1, 1, 1, headers.length).setValues([headers]);
    s.setFrozenRows(1);
  }
  return s;
}

function rowsToObjects(sheet, headers) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const values = sheet.getRange(2, 1, last - 1, headers.length).getValues();
  return values
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        let v = row[i];
        if (v === "") v = null;
        if (v instanceof Date) v = v.toISOString();
        obj[h] = v;
      });
      return obj;
    })
    .filter((o) => o.id);
}

function findRowIndex(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return -1;
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2;
  }
  return -1;
}

function appendRow(sheet, headers, obj) {
  const row = headers.map((h) => (h in obj && obj[h] !== undefined ? obj[h] : ""));
  sheet.appendRow(row);
}

function updateRow(sheet, headers, rowIndex, obj) {
  const current = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  const next = headers.map((h, i) => {
    if (obj[h] !== undefined) return obj[h] === null ? "" : obj[h];
    return current[i];
  });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([next]);
}

function deleteRow(sheet, rowIndex) {
  sheet.deleteRow(rowIndex);
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return Utilities.getUuid().replace(/-/g, "");
}

/* ---------- getAll ---------- */

function getAll() {
  const beansSheet    = sheet("Beans",    BEAN_HEADERS);
  const brewsSheet    = sheet("Brews",    BREW_HEADERS);
  const tastingsSheet = sheet("Tastings", TASTING_HEADERS);

  const beans    = rowsToObjects(beansSheet,    BEAN_HEADERS);
  const brews    = rowsToObjects(brewsSheet,    BREW_HEADERS);
  const tastings = rowsToObjects(tastingsSheet, TASTING_HEADERS);

  const tastingByBrew = {};
  tastings.forEach((t) => { if (t.brewId) tastingByBrew[t.brewId] = t; });

  const brewsByBean = {};
  brews.forEach((b) => {
    if (!brewsByBean[b.beanId]) brewsByBean[b.beanId] = [];
    brewsByBean[b.beanId].push({ ...b, tasting: tastingByBrew[b.id] || null });
  });

  Object.keys(brewsByBean).forEach((k) => {
    brewsByBean[k].sort((a, b) => (b.brewedAt || "").localeCompare(a.brewedAt || ""));
  });

  const beansWithBrews = beans
    .map((b) => ({ ...b, brews: brewsByBean[b.id] || [] }))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  return { beans: beansWithBrews };
}

/* ---------- beans ---------- */

function createBean(data) {
  const s = sheet("Beans", BEAN_HEADERS);
  const now = nowIso();
  const bean = { id: newId(), createdAt: now, updatedAt: now, ...data };
  appendRow(s, BEAN_HEADERS, bean);
  return bean;
}

function updateBean(id, patch) {
  const s = sheet("Beans", BEAN_HEADERS);
  const rowIndex = findRowIndex(s, id);
  if (rowIndex < 0) throw new Error("Bean not found: " + id);
  const updated = { ...patch, updatedAt: nowIso() };
  updateRow(s, BEAN_HEADERS, rowIndex, updated);
  const row = s.getRange(rowIndex, 1, 1, BEAN_HEADERS.length).getValues()[0];
  const obj = {};
  BEAN_HEADERS.forEach((h, i) => { obj[h] = row[i] === "" ? null : row[i]; });
  return obj;
}

function deleteBean(id) {
  const beansSheet    = sheet("Beans",    BEAN_HEADERS);
  const brewsSheet    = sheet("Brews",    BREW_HEADERS);
  const tastingsSheet = sheet("Tastings", TASTING_HEADERS);

  const rowIndex = findRowIndex(beansSheet, id);
  if (rowIndex < 0) throw new Error("Bean not found: " + id);
  deleteRow(beansSheet, rowIndex);

  const brews = rowsToObjects(brewsSheet, BREW_HEADERS);
  const brewsToDelete = brews.filter((b) => b.beanId === id).map((b) => b.id);

  for (let i = brewsToDelete.length - 1; i >= 0; i--) {
    const bIdx = findRowIndex(brewsSheet, brewsToDelete[i]);
    if (bIdx > 0) deleteRow(brewsSheet, bIdx);
    const tIdx = findTastingRowByBrewId(tastingsSheet, brewsToDelete[i]);
    if (tIdx > 0) deleteRow(tastingsSheet, tIdx);
  }
  return null;
}

/* ---------- brews ---------- */

function createBrew(data) {
  const brewsSheet = sheet("Brews", BREW_HEADERS);
  const beansSheet = sheet("Beans", BEAN_HEADERS);
  const now = nowIso();
  const brew = { id: newId(), createdAt: now, updatedAt: now, ...data };
  appendRow(brewsSheet, BREW_HEADERS, brew);

  const beanRow = findRowIndex(beansSheet, brew.beanId);
  if (beanRow > 0) {
    const values = beansSheet.getRange(beanRow, 1, 1, BEAN_HEADERS.length).getValues()[0];
    const remainingIdx = BEAN_HEADERS.indexOf("remainingGrams");
    const cur = Number(values[remainingIdx]) || 0;
    const newRemaining = Math.max(0, cur - Number(brew.dose));
    values[remainingIdx] = newRemaining;
    values[BEAN_HEADERS.indexOf("updatedAt")] = now;
    beansSheet.getRange(beanRow, 1, 1, BEAN_HEADERS.length).setValues([values]);
  }
  return brew;
}

function updateBrew(id, patch) {
  const s = sheet("Brews", BREW_HEADERS);
  const beansSheet = sheet("Beans", BEAN_HEADERS);
  const rowIndex = findRowIndex(s, id);
  if (rowIndex < 0) throw new Error("Brew not found: " + id);

  const existing = s.getRange(rowIndex, 1, 1, BREW_HEADERS.length).getValues()[0];
  const idxOf = (h) => BREW_HEADERS.indexOf(h);
  const oldDose = Number(existing[idxOf("dose")]) || 0;
  const beanId = existing[idxOf("beanId")];

  const updated = { ...patch, updatedAt: nowIso() };
  updateRow(s, BREW_HEADERS, rowIndex, updated);

  const newDose = patch.dose !== undefined ? Number(patch.dose) : oldDose;
  if (newDose !== oldDose && beanId) {
    const beanRow = findRowIndex(beansSheet, beanId);
    if (beanRow > 0) {
      const beanVals = beansSheet.getRange(beanRow, 1, 1, BEAN_HEADERS.length).getValues()[0];
      const remainingIdx = BEAN_HEADERS.indexOf("remainingGrams");
      const cur = Number(beanVals[remainingIdx]) || 0;
      beanVals[remainingIdx] = Math.max(0, cur - (newDose - oldDose));
      beanVals[BEAN_HEADERS.indexOf("updatedAt")] = nowIso();
      beansSheet.getRange(beanRow, 1, 1, BEAN_HEADERS.length).setValues([beanVals]);
    }
  }

  const row = s.getRange(rowIndex, 1, 1, BREW_HEADERS.length).getValues()[0];
  const obj = {};
  BREW_HEADERS.forEach((h, i) => { obj[h] = row[i] === "" ? null : row[i]; });
  return obj;
}

function deleteBrew(id) {
  const s = sheet("Brews", BREW_HEADERS);
  const beansSheet = sheet("Beans", BEAN_HEADERS);
  const tastingsSheet = sheet("Tastings", TASTING_HEADERS);
  const rowIndex = findRowIndex(s, id);
  if (rowIndex < 0) throw new Error("Brew not found: " + id);

  const existing = s.getRange(rowIndex, 1, 1, BREW_HEADERS.length).getValues()[0];
  const idxOf = (h) => BREW_HEADERS.indexOf(h);
  const dose = Number(existing[idxOf("dose")]) || 0;
  const beanId = existing[idxOf("beanId")];

  deleteRow(s, rowIndex);

  if (beanId) {
    const beanRow = findRowIndex(beansSheet, beanId);
    if (beanRow > 0) {
      const beanVals = beansSheet.getRange(beanRow, 1, 1, BEAN_HEADERS.length).getValues()[0];
      const remainingIdx = BEAN_HEADERS.indexOf("remainingGrams");
      const total = Number(beanVals[BEAN_HEADERS.indexOf("totalGrams")]) || 0;
      beanVals[remainingIdx] = Math.min(total, (Number(beanVals[remainingIdx]) || 0) + dose);
      beanVals[BEAN_HEADERS.indexOf("updatedAt")] = nowIso();
      beansSheet.getRange(beanRow, 1, 1, BEAN_HEADERS.length).setValues([beanVals]);
    }
  }
  const tIdx = findTastingRowByBrewId(tastingsSheet, id);
  if (tIdx > 0) deleteRow(tastingsSheet, tIdx);
  return null;
}

function duplicateBrew(id) {
  const s = sheet("Brews", BREW_HEADERS);
  const rowIndex = findRowIndex(s, id);
  if (rowIndex < 0) throw new Error("Brew not found: " + id);
  const values = s.getRange(rowIndex, 1, 1, BREW_HEADERS.length).getValues()[0];
  const obj = {};
  BREW_HEADERS.forEach((h, i) => { obj[h] = values[i] === "" ? null : values[i]; });
  const clone = { ...obj, brewedAt: nowIso() };
  delete clone.id;
  delete clone.createdAt;
  delete clone.updatedAt;
  return createBrew(clone);
}

/* ---------- tastings ---------- */

function findTastingRowByBrewId(sheet, brewId) {
  const last = sheet.getLastRow();
  if (last < 2) return -1;
  const brewIdIdx = TASTING_HEADERS.indexOf("brewId");
  const values = sheet.getRange(2, 1, last - 1, TASTING_HEADERS.length).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][brewIdIdx] === brewId) return i + 2;
  }
  return -1;
}

function upsertTasting(data) {
  const s = sheet("Tastings", TASTING_HEADERS);
  const existingRow = findTastingRowByBrewId(s, data.brewId);
  const now = nowIso();

  if (existingRow > 0) {
    updateRow(s, TASTING_HEADERS, existingRow, { ...data, updatedAt: now });
    const row = s.getRange(existingRow, 1, 1, TASTING_HEADERS.length).getValues()[0];
    const obj = {};
    TASTING_HEADERS.forEach((h, i) => { obj[h] = row[i] === "" ? null : row[i]; });
    return obj;
  }
  const tasting = { id: newId(), createdAt: now, updatedAt: now, ...data };
  appendRow(s, TASTING_HEADERS, tasting);
  return tasting;
}

function deleteTasting(id) {
  const s = sheet("Tastings", TASTING_HEADERS);
  const rowIndex = findRowIndex(s, id);
  if (rowIndex < 0) throw new Error("Tasting not found: " + id);
  deleteRow(s, rowIndex);
  return null;
}
