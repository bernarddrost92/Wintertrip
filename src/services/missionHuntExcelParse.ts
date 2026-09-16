import { parseDutchNumber } from '../utils/parseDutchNumber';
import { isValidIsoDate } from '../utils/dates';
import type { ParsedImportRow } from './missionHuntImportPreview';
import type { TeamImportRow } from '../types/missionHunt';

/** Canonical field keys, in template-column order. */
type TemplateField =
  | 'ownerDisplayName'
  | 'ownerEmail'
  | 'talentManagerDisplayName'
  | 'talentManagerEmail'
  | 'professionalName'
  | 'clientName'
  | 'monthlyDb'
  | 'hoursPerWeek'
  | 'startDate'
  | 'endDate';

/**
 * The exact template headers (see missionHuntExcelTemplate.ts) plus common
 * variants the office manager's own sheet might already use — recognition
 * is case-insensitive and whitespace-tolerant, but the canonical labels
 * above are what the template and error messages always show.
 */
const HEADER_TO_FIELD: Record<string, TemplateField> = {
  accountmanager: 'ownerDisplayName',
  'account manager': 'ownerDisplayName',
  am: 'ownerDisplayName',
  'e-mail accountmanager': 'ownerEmail',
  'email accountmanager': 'ownerEmail',
  'e-mailadres accountmanager': 'ownerEmail',
  'e-mail account manager': 'ownerEmail',
  email: 'ownerEmail',
  'e-mail': 'ownerEmail',
  'e-mailadres': 'ownerEmail',
  emailadres: 'ownerEmail',
  'talent manager': 'talentManagerDisplayName',
  talentmanager: 'talentManagerDisplayName',
  tm: 'talentManagerDisplayName',
  'e-mail talent manager': 'talentManagerEmail',
  'email talent manager': 'talentManagerEmail',
  'e-mailadres talent manager': 'talentManagerEmail',
  professional: 'professionalName',
  klant: 'clientName',
  client: 'clientName',
  'db per maand': 'monthlyDb',
  'db/maand': 'monthlyDb',
  db: 'monthlyDb',
  'vcdb per maand': 'monthlyDb',
  'uren per week': 'hoursPerWeek',
  'uren/week': 'hoursPerWeek',
  uren: 'hoursPerWeek',
  startdatum: 'startDate',
  'start datum': 'startDate',
  start: 'startDate',
  einddatum: 'endDate',
  'eind datum': 'endDate',
  eind: 'endDate',
};

const REQUIRED_HEADER_LABEL: Record<'ownerDisplayName' | 'ownerEmail' | 'professionalName' | 'clientName' | 'startDate' | 'endDate', string> = {
  ownerDisplayName: 'Accountmanager',
  ownerEmail: 'E-mail accountmanager',
  professionalName: 'Professional',
  clientName: 'Klant',
  startDate: 'Startdatum',
  endDate: 'Einddatum',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Multi-TM columns use ';' to separate values within one cell (Option B —
 * one placement row stays one row, never repeated per TM). Empty segments
 * from stray separators/whitespace are dropped, and an entirely empty cell
 * yields an empty list — a placement with no TM is valid. */
function splitSemicolonList(text: string): string[] {
  return text
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return '';
  return String(value).trim();
}

/** Formats via local date parts, not toISOString() — that converts to UTC
 * first and can silently shift the date by a day depending on the reader's
 * timezone and the time Excel stored (usually midnight local). */
function formatDateFromDateObject(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Accepts a real Date cell (SheetJS's cellDates:true), an already-ISO
 * "YYYY-MM-DD" string, or a Dutch "DD-MM-YYYY" / "D-M-YYYY" string —
 * returns null for anything else (including an empty cell). */
function parseDateCell(raw: unknown): string | null {
  if (raw instanceof Date) return formatDateFromDateObject(raw);
  const text = cellToText(raw);
  if (text === '') return null;
  if (isValidIsoDate(text)) return text;
  const dutch = String(text).match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dutch) {
    const [, day, month, year] = dutch;
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return isValidIsoDate(iso) ? iso : null;
  }
  return null;
}

/** Distinguishes "left empty" (valid, field just not filled in) from
 * "filled in but not a number" (an import error) — parseDutchNumber alone
 * collapses both to null. */
function parseOptionalNumberCell(raw: unknown): { ok: true; value: number | null } | { ok: false } {
  const text = cellToText(raw);
  if (text === '' && typeof raw !== 'number') return { ok: true, value: null };
  const parsed = parseDutchNumber(raw as string | number);
  return parsed === null ? { ok: false } : { ok: true, value: parsed };
}

export type HeaderCheckResult = { ok: true } | { ok: false; missing: string[] };

function checkHeaders(headerRow: unknown[]): HeaderCheckResult {
  const fieldsPresent = new Set(headerRow.map((cell) => HEADER_TO_FIELD[normalizeHeader(cell)]).filter(Boolean));
  const missing = (Object.keys(REQUIRED_HEADER_LABEL) as (keyof typeof REQUIRED_HEADER_LABEL)[])
    .filter((field) => !fieldsPresent.has(field))
    .map((field) => REQUIRED_HEADER_LABEL[field]);
  return missing.length > 0 ? { ok: false, missing } : { ok: true };
}

export type ParseTeamImportResult = { ok: true; rows: ParsedImportRow[] } | { ok: false; reason: 'missing_headers'; missing: string[] } | { ok: false; reason: 'empty' };

/**
 * Turns a 2D array-of-arrays (SheetJS's sheet_to_json(..., {header:1}) or a
 * hand-split pasted TSV block) into row-level validated/erroring results.
 * First row is always the header row; a row's number in every error and
 * preview matches its real Excel row (header = row 1, so the first data
 * row is row 2) so the office manager can find it without translation.
 * Never silently discards a malformed row — every row with a problem comes
 * back as an explicit error naming the row and the reason.
 */
export function parseTeamImportRows(aoa: unknown[][]): ParseTeamImportResult {
  if (aoa.length === 0) return { ok: false, reason: 'empty' };

  const [headerRow, ...dataRows] = aoa;
  const headerCheck = checkHeaders(headerRow);
  if (!headerCheck.ok) return { ok: false, reason: 'missing_headers', missing: headerCheck.missing };

  const fieldByColumn = headerRow.map((cell) => HEADER_TO_FIELD[normalizeHeader(cell)] ?? null);
  const rows: ParsedImportRow[] = [];

  dataRows.forEach((dataRow, index) => {
    const rowNumber = index + 2;
    if (dataRow === undefined || dataRow.every((cell) => cellToText(cell) === '' && !(cell instanceof Date))) return;

    const cells: Partial<Record<TemplateField, unknown>> = {};
    fieldByColumn.forEach((field, columnIndex) => {
      if (field) cells[field] = dataRow[columnIndex];
    });

    const ownerDisplayName = cellToText(cells.ownerDisplayName);
    const ownerEmail = cellToText(cells.ownerEmail);
    const talentManagerNamesRaw = cellToText(cells.talentManagerDisplayName);
    const talentManagerEmailsRaw = cellToText(cells.talentManagerEmail);
    const professionalName = cellToText(cells.professionalName);
    const clientName = cellToText(cells.clientName);
    const startDate = parseDateCell(cells.startDate);
    const endDate = parseDateCell(cells.endDate);
    const hours = parseOptionalNumberCell(cells.hoursPerWeek);
    const db = parseOptionalNumberCell(cells.monthlyDb);

    if (!ownerEmail) {
      rows.push({ rowNumber, ok: false, reason: 'Ontbrekend e-mailadres accountmanager' });
      return;
    }
    if (!EMAIL_PATTERN.test(ownerEmail)) {
      rows.push({ rowNumber, ok: false, reason: 'Ongeldig e-mailadres accountmanager' });
      return;
    }
    if (!ownerDisplayName) {
      rows.push({ rowNumber, ok: false, reason: 'Ontbrekende accountmanager' });
      return;
    }
    if (!professionalName) {
      rows.push({ rowNumber, ok: false, reason: 'Ontbrekende professional' });
      return;
    }
    if (!clientName) {
      rows.push({ rowNumber, ok: false, reason: 'Ontbrekende klant' });
      return;
    }
    if (cellToText(cells.startDate) === '' && !(cells.startDate instanceof Date)) {
      rows.push({ rowNumber, ok: false, reason: 'Ontbrekende startdatum' });
      return;
    }
    if (startDate === null) {
      rows.push({ rowNumber, ok: false, reason: 'Ongeldige startdatum' });
      return;
    }
    if (cellToText(cells.endDate) === '' && !(cells.endDate instanceof Date)) {
      rows.push({ rowNumber, ok: false, reason: 'Ontbrekende einddatum' });
      return;
    }
    if (endDate === null) {
      rows.push({ rowNumber, ok: false, reason: 'Ongeldige einddatum' });
      return;
    }
    if (endDate < startDate) {
      rows.push({ rowNumber, ok: false, reason: 'Einddatum ligt voor startdatum' });
      return;
    }
    if (!hours.ok) {
      rows.push({ rowNumber, ok: false, reason: 'Ongeldig aantal uren per week' });
      return;
    }
    if (!db.ok) {
      rows.push({ rowNumber, ok: false, reason: 'Ongeldige DB per maand' });
      return;
    }

    const talentManagerEmails = splitSemicolonList(talentManagerEmailsRaw);
    const invalidTmEmail = talentManagerEmails.find((email) => !EMAIL_PATTERN.test(email));
    if (invalidTmEmail) {
      rows.push({ rowNumber, ok: false, reason: `Ongeldig e-mailadres talent manager (${invalidTmEmail})` });
      return;
    }
    const talentManagerDisplayNames = splitSemicolonList(talentManagerNamesRaw);

    const row: TeamImportRow = {
      ownerEmail,
      ownerDisplayName,
      professionalName,
      clientName,
      startDate,
      endDate,
      hoursPerWeek: hours.value,
      monthlyDb: db.value,
      talentManagerEmails,
      talentManagerDisplayNames,
    };
    rows.push({ rowNumber, ok: true, row });
  });

  return { ok: true, rows };
}

/** Splits a clipboard paste of tab-separated Excel rows into the same 2D
 * shape parseTeamImportRows expects. Trailing empty lines (a common
 * trailing newline from copying a full range) are dropped. */
export function parseTabSeparatedText(text: string): unknown[][] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'));
}
