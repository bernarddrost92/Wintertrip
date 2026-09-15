import { describe, expect, it } from 'vitest';
import { readWorkbookRows } from './missionHuntWorkbook';
import { parseProjectRows } from './missionHuntExcelParse';

function textToArrayBuffer(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer;
}

describe('readWorkbookRows — CSV import', () => {
  it('parses a CSV file\'s bytes into the same row shape as an .xlsx import', () => {
    const csv = 'Project,Klant,Professional\nDe Meerwaarde,Han,docent Nederlands\nGreijdanus,Ryan,Economie\n';
    const rows = readWorkbookRows(textToArrayBuffer(csv));
    const result = parseProjectRows(rows);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].projectName).toBe('De Meerwaarde');
      expect(result.rows[1].clientName).toBe('Ryan');
    }
  });

  it('surfaces a missing-header CSV the same way as a missing-header workbook', () => {
    const csv = 'Klant,Professional\nHan,x\n';
    const rows = readWorkbookRows(textToArrayBuffer(csv));
    const result = parseProjectRows(rows);
    expect(result.ok).toBe(false);
  });
});
