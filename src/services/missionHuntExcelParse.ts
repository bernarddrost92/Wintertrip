import { parseDutchNumber } from '../utils/parseDutchNumber';
import type { NewProjectInput } from '../types/missionHunt';

/** Canonical field keys in template-column order. */
type TemplateField = keyof NewProjectInput;

/** The exact template headers (see missionHuntExcelTemplate.ts), each mapped
 * to its canonical field after normalizing. Recognition is case-insensitive
 * and whitespace-tolerant, per spec section 12. */
const HEADER_TO_FIELD: Record<string, TemplateField> = {
  project: 'projectName',
  klant: 'clientName',
  professional: 'professionalName',
  startdatum: 'startDate',
  einddatum: 'endDate',
  'uren per week': 'hoursPerWeek',
  'vcdb per maand': 'monthlyVcdb',
  opmerking: 'note',
};

const REQUIRED_HEADER_LABEL: Record<'projectName' | 'clientName', string> = {
  projectName: 'Project',
  clientName: 'Klant',
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return formatDateCell(value);
  return String(value).trim();
}

/** Formats via local date parts, not toISOString() — that converts to UTC
 * first and can silently shift the date by a day depending on the reader's
 * timezone and the time Excel stored (usually midnight local). */
function formatDateCell(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type ParsedRowsResult =
  | { ok: true; rows: NewProjectInput[] }
  | { ok: false; reason: 'missing_headers'; missing: string[] }
  | { ok: false; reason: 'empty' };

/**
 * Turns a 2D array-of-arrays (the shape both SheetJS's sheet_to_json(...,
 * {header:1}) and a hand-split pasted TSV block produce) into validated
 * project inputs. First row is always the header row.
 */
export function parseProjectRows(aoa: unknown[][]): ParsedRowsResult {
  if (aoa.length === 0) return { ok: false, reason: 'empty' };

  const [headerRow, ...dataRows] = aoa;
  const fieldByColumn = headerRow.map((cell) => HEADER_TO_FIELD[normalizeHeader(cell)] ?? null);

  const requiredFields = Object.keys(REQUIRED_HEADER_LABEL) as ('projectName' | 'clientName')[];
  const missing = requiredFields.filter((field) => !fieldByColumn.includes(field));
  if (missing.length > 0) {
    return { ok: false, reason: 'missing_headers', missing: missing.map((field) => REQUIRED_HEADER_LABEL[field]) };
  }

  const rows: NewProjectInput[] = [];
  for (const row of dataRows) {
    if (row === undefined || row.every((cell) => cellToText(cell) === '')) continue;

    const input: Record<string, string | number | null> = {};
    fieldByColumn.forEach((field, columnIndex) => {
      if (!field) return;
      const raw = row[columnIndex];
      const text = cellToText(raw);
      if (field === 'hoursPerWeek' || field === 'monthlyVcdb') {
        input[field] = text === '' ? null : parseDutchNumber(raw as string | number);
      } else if (field === 'startDate' || field === 'endDate') {
        input[field] = text === '' ? null : text;
      } else {
        input[field] = text === '' ? (field === 'projectName' || field === 'clientName' ? '' : null) : text;
      }
    });

    // Rows missing a required value are silently skipped rather than
    // surfaced as "errors" — a stray blank row from Excel is not a mistake
    // the user needs to fix, it's just not a project.
    if (!input.projectName || !input.clientName) continue;

    rows.push({
      projectName: input.projectName as string,
      clientName: input.clientName as string,
      professionalName: (input.professionalName as string | null) ?? null,
      startDate: (input.startDate as string | null) ?? null,
      endDate: (input.endDate as string | null) ?? null,
      hoursPerWeek: (input.hoursPerWeek as number | null) ?? null,
      monthlyVcdb: (input.monthlyVcdb as number | null) ?? null,
      note: (input.note as string | null) ?? null,
    });
  }

  return { ok: true, rows };
}

/** Splits a clipboard paste of tab-separated Excel rows into the same 2D
 * shape parseProjectRows expects. Trailing empty lines (a common trailing
 * newline from copying a full range) are dropped. */
export function parseTabSeparatedText(text: string): unknown[][] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'));
}
