import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildTemplateWorkbook, TEMPLATE_FILENAME, TEMPLATE_HEADERS, TEMPLATE_SHEET_NAME } from './missionHuntExcelTemplate';
import { readWorkbookRows } from './missionHuntWorkbook';
import { parseTeamImportRows } from './missionHuntExcelParse';

describe('buildTemplateWorkbook', () => {
  it('is named Mission_Hunt_Team_Import_Template.xlsx', () => {
    expect(TEMPLATE_FILENAME).toBe('Mission_Hunt_Team_Import_Template.xlsx');
  });

  it('has a PLAATSINGEN sheet with exactly the required column headers, and a UITLEG sheet', () => {
    const workbook = buildTemplateWorkbook();
    expect(workbook.SheetNames).toEqual([TEMPLATE_SHEET_NAME, 'UITLEG']);

    const sheet = workbook.Sheets[TEMPLATE_SHEET_NAME];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    expect(rows[0]).toEqual([...TEMPLATE_HEADERS]);
    expect(TEMPLATE_HEADERS).toEqual([
      'Accountmanager',
      'E-mail accountmanager',
      'Talent Manager',
      'E-mail Talent Manager',
      'Professional',
      'Klant',
      'DB per maand',
      'Uren per week',
      'Startdatum',
      'Einddatum',
    ]);
  });

  it('the UITLEG sheet carries short instruction lines', () => {
    const workbook = buildTemplateWorkbook();
    const sheet = workbook.Sheets['UITLEG'];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0][0]).toContain('centraal bestand');
  });

  it('the generated template headers are recognized by the import parser end-to-end', () => {
    // Simulates: download the real template, fill in one row (including a
    // Talent Manager), re-upload it.
    const workbook = buildTemplateWorkbook();
    const sheet = workbook.Sheets[TEMPLATE_SHEET_NAME];
    XLSX.utils.sheet_add_aoa(sheet, [['Lisa', 'lisa@maandag.com', 'Kim', 'kim.schuring@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '10', '24', '2026-10-01', '2026-12-31']], { origin: -1 });

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const rows = readWorkbookRows(buffer);
    const result = parseTeamImportRows(rows);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      const [first] = result.rows;
      expect(first.ok).toBe(true);
      if (first.ok) {
        expect(first.row.ownerDisplayName).toBe('Lisa');
        expect(first.row.hoursPerWeek).toBe(24);
        expect(first.row.talentManagerEmails).toEqual(['kim.schuring@maandag.com']);
      }
    }
  });
});
