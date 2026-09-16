import { describe, expect, it } from 'vitest';
import { readWorkbookRows } from './missionHuntWorkbook';
import { parseTeamImportRows } from './missionHuntExcelParse';

function textToArrayBuffer(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer;
}

describe('readWorkbookRows — CSV import', () => {
  it('parses a CSV file\'s bytes into the same row shape as an .xlsx import', () => {
    const csv =
      'Accountmanager,E-mail accountmanager,Professional,Klant,Startdatum,Einddatum\n' +
      'Lisa,lisa@maandag.com,Ryan Dijkstra,Greijdanus,2026-10-01,2026-12-31\n' +
      'Marco,marco@maandag.com,Ander Persoon,Andere Klant,2026-09-01,2026-11-30\n';
    const rows = readWorkbookRows(textToArrayBuffer(csv));
    const result = parseTeamImportRows(rows);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(2);
      const [first, second] = result.rows;
      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      if (first.ok) expect(first.row.ownerDisplayName).toBe('Lisa');
      if (second.ok) expect(second.row.clientName).toBe('Andere Klant');
    }
  });

  it('surfaces a missing-header CSV the same way as a missing-header workbook', () => {
    const csv = 'Klant,Professional\nHan,x\n';
    const rows = readWorkbookRows(textToArrayBuffer(csv));
    const result = parseTeamImportRows(rows);
    expect(result.ok).toBe(false);
  });
});
