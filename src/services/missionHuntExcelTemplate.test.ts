import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildTemplateWorkbook, TEMPLATE_HEADERS, TEMPLATE_SHEET_NAME } from './missionHuntExcelTemplate';
import { readWorkbookRows } from './missionHuntWorkbook';
import { parseProjectRows } from './missionHuntExcelParse';

describe('buildTemplateWorkbook', () => {
  it('has a PROJECTEN sheet with exactly the required column headers, and a UITLEG sheet', () => {
    const workbook = buildTemplateWorkbook();
    expect(workbook.SheetNames).toEqual([TEMPLATE_SHEET_NAME, 'UITLEG']);

    const sheet = workbook.Sheets[TEMPLATE_SHEET_NAME];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    expect(rows[0]).toEqual([...TEMPLATE_HEADERS]);
  });

  it('the UITLEG sheet carries the 5 short instruction lines', () => {
    const workbook = buildTemplateWorkbook();
    const sheet = workbook.Sheets['UITLEG'];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    expect(rows).toHaveLength(5);
    expect(rows[0][0]).toContain('Vul al je projecten in');
  });

  it('the generated template headers are recognized by the import parser end-to-end', () => {
    // Simulates: download the real template, fill in one row, re-upload it.
    const workbook = buildTemplateWorkbook();
    const sheet = workbook.Sheets[TEMPLATE_SHEET_NAME];
    XLSX.utils.sheet_add_aoa(sheet, [['De Meerwaarde', 'Han', 'docent Nederlands', '', '', '16', '', '']], { origin: -1 });

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const rows = readWorkbookRows(buffer);
    const result = parseProjectRows(rows);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].projectName).toBe('De Meerwaarde');
      expect(result.rows[0].hoursPerWeek).toBe(16);
    }
  });
});
