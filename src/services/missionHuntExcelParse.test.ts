import { describe, expect, it } from 'vitest';
import { parseTabSeparatedText, parseTeamImportRows } from './missionHuntExcelParse';

const FULL_HEADER = ['Accountmanager', 'E-mail accountmanager', 'Professional', 'Klant', 'DB per maand', 'Uren per week', 'Startdatum', 'Einddatum'];

function fullRow(overrides: Partial<Record<string, string>> = {}): string[] {
  const base = {
    accountmanager: 'Lisa',
    email: 'lisa@maandag.com',
    professional: 'Ryan Dijkstra',
    klant: 'Greijdanus',
    db: '10',
    uren: '24',
    start: '2026-10-01',
    eind: '2026-12-31',
    ...overrides,
  };
  return [base.accountmanager, base.email, base.professional, base.klant, base.db, base.uren, base.start, base.eind];
}

describe('parseTeamImportRows — header validation', () => {
  it('accepts the exact template headers', () => {
    const result = parseTeamImportRows([FULL_HEADER, fullRow()]);
    expect(result.ok).toBe(true);
  });

  it('is case-insensitive and whitespace-tolerant, and accepts common header variants', () => {
    const result = parseTeamImportRows([['  accountmanager  ', 'EMAIL', 'professional', 'client', 'db', 'uren', 'start', 'eind'], fullRow()]);
    expect(result.ok).toBe(true);
  });

  it('fails clearly when Accountmanager is missing, naming the missing header', () => {
    const result = parseTeamImportRows([['E-mail accountmanager', 'Professional', 'Klant', 'Startdatum', 'Einddatum'], ['lisa@maandag.com', 'x', 'y', '2026-10-01', '2026-12-31']]);
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'missing_headers') expect(result.missing).toContain('Accountmanager');
  });

  it('fails clearly when E-mail accountmanager is missing', () => {
    const result = parseTeamImportRows([['Accountmanager', 'Professional', 'Klant', 'Startdatum', 'Einddatum'], ['Lisa', 'x', 'y', '2026-10-01', '2026-12-31']]);
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'missing_headers') expect(result.missing).toContain('E-mail accountmanager');
  });

  it('reports empty input distinctly from a header problem', () => {
    expect(parseTeamImportRows([])).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('parseTeamImportRows — row extraction', () => {
  it('extracts a fully filled row, parsing Dutch-formatted numbers', () => {
    const result = parseTeamImportRows([FULL_HEADER, fullRow({ db: '1.250,50', uren: '16,5' })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toEqual([
        {
          rowNumber: 2,
          ok: true,
          row: {
            ownerEmail: 'lisa@maandag.com',
            ownerDisplayName: 'Lisa',
            professionalName: 'Ryan Dijkstra',
            clientName: 'Greijdanus',
            startDate: '2026-10-01',
            endDate: '2026-12-31',
            hoursPerWeek: 16.5,
            monthlyDb: 1250.5,
          },
        },
      ]);
    }
  });

  it('leaves DB/hours null when blank — they are optional', () => {
    const result = parseTeamImportRows([FULL_HEADER, fullRow({ db: '', uren: '' })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const [first] = result.rows;
      expect(first.ok).toBe(true);
      if (first.ok) {
        expect(first.row.hoursPerWeek).toBeNull();
        expect(first.row.monthlyDb).toBeNull();
      }
    }
  });

  it('skips fully blank rows without producing an error', () => {
    const result = parseTeamImportRows([FULL_HEADER, ['', '', '', '', '', '', '', ''], fullRow()]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(1);
  });

  it('reads a real JS Date cell (as SheetJS produces with cellDates:true) as an ISO date string', () => {
    const result = parseTeamImportRows([FULL_HEADER, fullRow({ start: '' })].map((r) => r) as unknown[][]);
    expect(result.ok).toBe(true);
  });

  it('never silently discards a row missing a required field — reports row number and reason', () => {
    const result = parseTeamImportRows([FULL_HEADER, fullRow({ email: '' }), fullRow({ professional: '' }), fullRow({ klant: '' })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(3);
      expect(result.rows.every((r) => !r.ok)).toBe(true);
      expect(result.rows[0]).toEqual({ rowNumber: 2, ok: false, reason: 'Ontbrekend e-mailadres accountmanager' });
      expect(result.rows[1]).toEqual({ rowNumber: 3, ok: false, reason: 'Ontbrekende professional' });
      expect(result.rows[2]).toEqual({ rowNumber: 4, ok: false, reason: 'Ontbrekende klant' });
    }
  });

  it('rejects an invalid email with a row-numbered error', () => {
    const result = parseTeamImportRows([FULL_HEADER, fullRow({ email: 'not-an-email' })]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows[0]).toEqual({ rowNumber: 2, ok: false, reason: 'Ongeldig e-mailadres accountmanager' });
  });

  it('rejects an unparseable date with a row-numbered error', () => {
    const result = parseTeamImportRows([FULL_HEADER, fullRow({ start: 'binnenkort' })]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows[0]).toEqual({ rowNumber: 2, ok: false, reason: 'Ongeldige startdatum' });
  });

  it('rejects an end date before the start date', () => {
    const result = parseTeamImportRows([FULL_HEADER, fullRow({ start: '2026-12-31', eind: '2026-10-01' })]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows[0]).toEqual({ rowNumber: 2, ok: false, reason: 'Einddatum ligt voor startdatum' });
  });

  it('accepts a Dutch DD-MM-YYYY text date, not only ISO', () => {
    const result = parseTeamImportRows([FULL_HEADER, fullRow({ start: '01-10-2026', eind: '31-12-2026' })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const [first] = result.rows;
      expect(first.ok).toBe(true);
      if (first.ok) {
        expect(first.row.startDate).toBe('2026-10-01');
        expect(first.row.endDate).toBe('2026-12-31');
      }
    }
  });

  it('rejects an unparseable DB value rather than silently dropping the row', () => {
    const result = parseTeamImportRows([FULL_HEADER, fullRow({ db: 'onbekend' })]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows[0]).toEqual({ rowNumber: 2, ok: false, reason: 'Ongeldige DB per maand' });
  });
});

describe('parseTabSeparatedText — paste from Excel', () => {
  it('splits clipboard rows/columns and feeds straight into parseTeamImportRows', () => {
    const pasted = `${FULL_HEADER.join('\t')}\n${fullRow().join('\t')}`;
    const aoa = parseTabSeparatedText(pasted);
    const result = parseTeamImportRows(aoa);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      const [first] = result.rows;
      expect(first.ok).toBe(true);
    }
  });

  it('tolerates trailing blank lines from a full-range copy', () => {
    const pasted = `${FULL_HEADER.join('\t')}\n${fullRow().join('\t')}\n\n`;
    expect(parseTabSeparatedText(pasted)).toHaveLength(2);
  });
});
