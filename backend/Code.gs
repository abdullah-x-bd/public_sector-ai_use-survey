/**
 * Google Apps Script response collector for the Public Sector AI Survey.
 * Deploy this script as a Web App.
 * Execute as: Me
 * Who has access: Anyone
 */

const SPREADSHEET_ID = '1JbxZGxf-V2mQW5jsVa-X5EcU2dwR27CmBezgn9g7iOQ';
const SHEET_NAME = 'responses';
const SURVEY_VERSION = '1.0.0';
const COLLECTOR_BUILD = '2026-08-30-fix1';

function doGet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return json_({
      ok: true,
      service: 'public-sector-ai-survey-collector',
      build: COLLECTOR_BUILD,
      spreadsheet: ss.getName()
    });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'spreadsheet_unavailable', build: COLLECTOR_BUILD });
  }
}

function doPost(e) {
  try {
    if (!e || !e.parameter || !e.parameter.payload) {
      return json_({ ok: false, error: 'missing_payload', build: COLLECTOR_BUILD });
    }

    const payload = JSON.parse(e.parameter.payload);
    validate_(payload);

    if (payload.honeypot) {
      return json_({ ok: true, build: COLLECTOR_BUILD });
    }

    const sheet = getSheet_();
    const row = flatten_(payload);
    ensureHeader_(sheet, Object.keys(row));

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    sheet.appendRow(headers.map(h => row[h] ?? ''));
    SpreadsheetApp.flush();

    return json_({ ok: true, response_id: payload.response_id, build: COLLECTOR_BUILD });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'invalid_submission', detail: String(err), build: COLLECTOR_BUILD });
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeader_(sheet, keys) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
    sheet.setFrozenRows(1);
    return;
  }

  const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const missing = keys.filter(k => !existing.includes(k));
  if (missing.length) {
    sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }
}

function validate_(p) {
  if (!p || typeof p !== 'object') throw new Error('payload');
  if (p.survey_version !== SURVEY_VERSION) throw new Error('version');
  if (!p.response_id || String(p.response_id).length > 100) throw new Error('response_id');
  if (!p.demographics || !p.post || !Array.isArray(p.choices) || p.choices.length !== 8) throw new Error('shape');

  const allowedPositions = ['A', 'B'];
  p.choices.forEach((c, i) => {
    if (!c || c.taskId !== `T${i + 1}`) throw new Error('task');
    if (!allowedPositions.includes(c.selectedPosition)) throw new Error('choice');
    if (!c.selectedProfileId || !c.displayedA || !c.displayedB) throw new Error('profiles');
  });

  if ((p.post.open_text || '').length > 1000) throw new Error('open_text');
}

function flatten_(p) {
  const d = p.demographics || {};
  const post = p.post || {};
  const row = {
    response_id: p.response_id,
    survey_version: p.survey_version,
    started_at: p.started_at,
    submitted_at: p.submitted_at,
    duration_seconds: p.duration_seconds,
    age_group: d.age || '',
    gender: d.gender || '',
    education: d.education || '',
    field: d.field || '',
    genai_frequency: d.genai || '',
    public_benefit_experience: d.benefit || ''
  };

  (p.choices || []).forEach((c, idx) => {
    const n = idx + 1;
    row[`choice_${n}_task`] = c.taskId;
    row[`choice_${n}_system_a_profile`] = c.displayedA;
    row[`choice_${n}_system_b_profile`] = c.displayedB;
    row[`choice_${n}_selected_position`] = c.selectedPosition;
    row[`choice_${n}_selected_profile`] = c.selectedProfileId;
    row[`choice_${n}_swapped`] = Boolean(c.swapped);
  });

  row.stated_priority = post.priority || '';
  row.ai_acceptability = post.accept_ai || '';
  row.human_final_decision_acceptability = post.accept_human || '';
  row.comprehension_confidence = post.confidence || '';
  row.open_text = post.open_text || '';
  return row;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
