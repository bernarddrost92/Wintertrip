import { describe, expect, it } from 'vitest';
import { parseProjectRows, parseTabSeparatedText } from './missionHuntExcelParse';

const FULL_HEADER = ['Project', 'Klant', 'Professional', 'Startdatum', 'Einddatum', 'Uren per week', 'VCDB per maand', 'Opmerking'];

describe('parseProjectRows — header validation', () => {
  it('accepts the exact template headers', () => {
    const result = parseProjectRows([FULL_HEADER, ['De Meerwaarde', 'Han', 'docent Nederlands', '', '', '', '', '']]);
    expect(result.ok).toBe(true);
  });

  it('is case-insensitive and whitespace-tolerant', () => {
    const result = parseProjectRows([['  project  ', 'KLANT'], ['De Meerwaarde', 'Han']]);
    expect(result.ok).toBe(true);
  });

  it('fails clearly when Project is missing, naming the missing header', () => {
    const result = parseProjectRows([['Klant', 'Professional'], ['Han', 'x']]);
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'missing_headers') {
      expect(result.missing).toContain('Project');
    }
  });

  it('fails clearly when Klant is missing', () => {
    const result = parseProjectRows([['Project'], ['De Meerwaarde']]);
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'missing_headers') {
      expect(result.missing).toContain('Klant');
    }
  });

  it('reports empty input distinctly from a header problem', () => {
    const result = parseProjectRows([]);
    expect(result).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('parseProjectRows — row extraction', () => {
  it('extracts all optional fields, parsing Dutch-formatted numbers', () => {
    const result = parseProjectRows([FULL_HEADER, ['De Meerwaarde', 'Han', 'docent Nederlands', '2026-09-01', '2027-01-31', '16,5', '1.250,50', 'Interessant']]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toEqual([
        {
          projectName: 'De Meerwaarde',
          clientName: 'Han',
          professionalName: 'docent Nederlands',
          startDate: '2026-09-01',
          endDate: '2027-01-31',
          hoursPerWeek: 16.5,
          monthlyVcdb: 1250.5,
          note: 'Interessant',
        },
      ]);
    }
  });

  it('leaves optional fields null when blank, never throwing on missing optional columns', () => {
    const result = parseProjectRows([['Project', 'Klant'], ['Greijdanus', 'Ryan']]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]).toEqual({
        projectName: 'Greijdanus',
        clientName: 'Ryan',
        professionalName: null,
        startDate: null,
        endDate: null,
        hoursPerWeek: null,
        monthlyVcdb: null,
        note: null,
      });
    }
  });

  it('skips fully blank rows without producing an error', () => {
    const result = parseProjectRows([FULL_HEADER, ['', '', '', '', '', '', '', ''], ['De Meerwaarde', 'Han', '', '', '', '', '', '']]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(1);
  });

  it('skips a row missing a required value (Project or Klant blank) rather than throwing', () => {
    const result = parseProjectRows([FULL_HEADER, ['', 'Han', '', '', '', '', '', ''], ['Greijdanus', '', '', '', '', '', '', '']]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(0);
  });

  it('reads a real JS Date cell (as SheetJS produces with cellDates:true) as an ISO date string', () => {
    const result = parseProjectRows([FULL_HEADER, ['De Meerwaarde', 'Han', '', new Date(2026, 8, 14), '', '', '', '']]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows[0].startDate).toBe('2026-09-14');
  });
});

describe('parseTabSeparatedText — paste from Excel', () => {
  it('splits clipboard rows/columns and feeds straight into parseProjectRows', () => {
    const pasted = 'Project\tKlant\tProfessional\nDe Meerwaarde\tHan\tdocent Nederlands\nGreijdanus\tRyan\tEconomie';
    const aoa = parseTabSeparatedText(pasted);
    const result = parseProjectRows(aoa);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].projectName).toBe('De Meerwaarde');
      expect(result.rows[1].professionalName).toBe('Economie');
    }
  });

  it('tolerates trailing blank lines from a full-range copy', () => {
    const pasted = 'Project\tKlant\nDe Meerwaarde\tHan\n\n';
    expect(parseTabSeparatedText(pasted)).toHaveLength(2);
  });
});
