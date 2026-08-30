/**
 * Google Apps Script response collector for the Public Sector AI Survey.
 * Survey design v3.0.0
 * Deploy as Web App.
 * Execute as: Me
 * Who has access: Anyone
 */

const SPREADSHEET_ID = '1JbxZGxf-V2mQW5jsVa-X5EcU2dwR27CmBezgn9g7iOQ';
const SHEET_NAME = 'responses_v3';
const SURVEY_VERSION = '3.0.0';
const COLLECTOR_BUILD = '2026-08-30-design-v3';

function doGet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return json_({
      ok: true,
      service: 'public-sector-ai-survey-collector',
      build: COLLECTOR_BUILD,
      survey_version: SURVEY_VERSION,
      spreadsheet: ss.getName(),
      response_sheet: SHEET_NAME
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
  if (!['B1','B2','B3','B4'].includes(p.design_block)) throw new Error('design_block');
  if (!p.demographics || !p.post || !Array.isArray(p.choices) || p.choices.length !== 8) throw new Error('shape');

  const allowedTaskIds = new Set(['T1','T2','T3','T4','T5','T6','T7','T8']);
  const allowedPositions = new Set(['A', 'B']);
  const allowedProfiles = new Set([
    'P0000','P0001','P0010','P0011','P0100','P0101','P0110','P0111',
    'P1000','P1001','P1010','P1011','P1100','P1101','P1110','P1111'
  ]);
  const seenTasks = new Set();
  const seenProfiles = new Set();

  p.choices.forEach(c => {
    if (!c || !allowedTaskIds.has(c.taskId)) throw new Error('task');
    if (seenTasks.has(c.taskId)) throw new Error('duplicate_task');
    seenTasks.add(c.taskId);
    if (!allowedPositions.has(c.selectedPosition)) throw new Error('choice');
    if (!allowedProfiles.has(c.selectedProfileId) || !allowedProfiles.has(c.displayedA) || !allowedProfiles.has(c.displayedB)) throw new Error('profiles');
    if (c.displayedA === c.displayedB) throw new Error('same_profile');
    seenProfiles.add(c.displayedA);
    seenProfiles.add(c.displayedB);
    if (!Number.isInteger(Number(c.presentationOrder)) || Number(c.presentationOrder) < 1 || Number(c.presentationOrder) > 8) throw new Error('order');
  });

  if (seenTasks.size !== 8) throw new Error('missing_task');
  if (seenProfiles.size !== 16) throw new Error('profile_coverage');
  if ((p.post.open_text || '').length > 1000) throw new Error('open_text');
}

function flatten_(p) {
  const d = p.demographics || {};
  const post = p.post || {};
  const row = {
    response_id: p.response_id,
    survey_version: p.survey_version,
    schema_version: p.schema_version || '',
    design_block: p.design_block || '',
    started_at: p.started_at,
    submitted_at: p.submitted_at,
    duration_seconds: p.duration_seconds,
    country_or_territory: d.country || '',
    age_group: d.age || '',
    gender: d.gender || '',
    education: d.education || '',
    genai_frequency: d.genai || '',
    public_benefit_experience: d.benefit || ''
  };

  (p.choices || []).forEach((c, idx) => {
    const n = idx + 1;
    row[`presented_${n}_task`] = c.taskId;
    row[`presented_${n}_system_a_profile`] = c.displayedA;
    row[`presented_${n}_system_b_profile`] = c.displayedB;
    row[`presented_${n}_selected_position`] = c.selectedPosition;
    row[`presented_${n}_selected_profile`] = c.selectedProfileId;
    row[`presented_${n}_swapped`] = Boolean(c.swapped);
    row[`presented_${n}_order`] = c.presentationOrder;
    row[`presented_${n}_dominated_check`] = Boolean(c.dominatedCheck);
  });

  row.stated_priority = post.priority || '';
  row.ai_acceptability = post.accept_ai || '';
  row.human_initial_decision_acceptability = post.accept_human || '';
  row.comprehension_confidence = post.confidence || '';
  row.open_text = post.open_text || '';
  return row;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
