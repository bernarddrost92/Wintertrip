import { describe, expect, it } from 'vitest';
import { buildTeamImportPreview, type ExistingPlacementForImport, type ParsedImportRow } from './missionHuntImportPreview';
import { buildPlacementFingerprint } from './missionHuntFingerprint';
import type { TeamImportRow } from '../types/missionHunt';

function importRow(overrides: Partial<TeamImportRow> = {}): TeamImportRow {
  return {
    ownerEmail: 'lisa@maandag.com',
    ownerDisplayName: 'Lisa',
    professionalName: 'Ryan Dijkstra',
    clientName: 'Greijdanus',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    hoursPerWeek: 24,
    monthlyDb: 10,
    ...overrides,
  };
}

function ok(rowNumber: number, row: TeamImportRow): ParsedImportRow {
  return { rowNumber, ok: true, row };
}

function err(rowNumber: number, reason: string): ParsedImportRow {
  return { rowNumber, ok: false, reason };
}

describe('buildTeamImportPreview', () => {
  it('classifies every row as NEW when there are no existing placements', () => {
    const preview = buildTeamImportPreview([ok(2, importRow()), ok(3, importRow({ clientName: 'Andere Klant' }))], []);
    expect(preview.totalFound).toBe(2);
    expect(preview.newRows).toHaveLength(2);
    expect(preview.changedRows).toHaveLength(0);
    expect(preview.unchangedRows).toHaveLength(0);
    expect(preview.errorRows).toHaveLength(0);
  });

  it('classifies a row matching an existing fingerprint with identical fields as UNCHANGED', () => {
    const row = importRow();
    const fingerprint = buildPlacementFingerprint(row.ownerEmail, row.professionalName, row.clientName, row.startDate, row.endDate);
    const existing: ExistingPlacementForImport[] = [{ id: 'existing-1', fingerprint, ownerDisplayName: row.ownerDisplayName, hoursPerWeek: row.hoursPerWeek, monthlyDb: row.monthlyDb }];

    const preview = buildTeamImportPreview([ok(2, row)], existing);
    expect(preview.newRows).toHaveLength(0);
    expect(preview.changedRows).toHaveLength(0);
    expect(preview.unchangedRows).toHaveLength(1);
    expect(preview.unchangedRows[0].existingId).toBe('existing-1');
  });

  it('classifies a fingerprint match with different hours/DB as CHANGED, naming the changed fields', () => {
    const row = importRow({ hoursPerWeek: 32, monthlyDb: 15 });
    const fingerprint = buildPlacementFingerprint(row.ownerEmail, row.professionalName, row.clientName, row.startDate, row.endDate);
    const existing: ExistingPlacementForImport[] = [{ id: 'existing-1', fingerprint, ownerDisplayName: row.ownerDisplayName, hoursPerWeek: 24, monthlyDb: 10 }];

    const preview = buildTeamImportPreview([ok(2, row)], existing);
    expect(preview.changedRows).toHaveLength(1);
    expect(preview.changedRows[0].existingId).toBe('existing-1');
    expect(preview.changedRows[0].changedFields.sort()).toEqual(['hoursPerWeek', 'monthlyDb']);
  });

  it('a changed accountmanager display name (same person/placement) is CHANGED, not a new placement', () => {
    const row = importRow({ ownerDisplayName: 'Lisa de Vries' });
    const fingerprint = buildPlacementFingerprint(row.ownerEmail, row.professionalName, row.clientName, row.startDate, row.endDate);
    const existing: ExistingPlacementForImport[] = [{ id: 'existing-1', fingerprint, ownerDisplayName: 'Lisa', hoursPerWeek: row.hoursPerWeek, monthlyDb: row.monthlyDb }];

    const preview = buildTeamImportPreview([ok(2, row)], existing);
    expect(preview.changedRows).toHaveLength(1);
    expect(preview.changedRows[0].changedFields).toEqual(['ownerDisplayName']);
  });

  it('a changed professional/client/date is a different fingerprint entirely — NEW, not CHANGED (never guesses a rename)', () => {
    const existing: ExistingPlacementForImport[] = [
      {
        id: 'existing-1',
        fingerprint: buildPlacementFingerprint('lisa@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2026-12-31'),
        ownerDisplayName: 'Lisa',
        hoursPerWeek: 24,
        monthlyDb: 10,
      },
    ];
    const preview = buildTeamImportPreview([ok(2, importRow({ clientName: 'Nieuwe Klant' }))], existing);
    expect(preview.newRows).toHaveLength(1);
    expect(preview.changedRows).toHaveLength(0);
  });

  it('dedupes identical rows within the same import batch (duplicate rows in one file)', () => {
    const preview = buildTeamImportPreview([ok(2, importRow()), ok(3, importRow())], []);
    expect(preview.newRows).toHaveLength(1);
    expect(preview.unchangedRows).toHaveLength(1);
  });

  it('importing the exact same file twice produces zero NEW rows on the second pass', () => {
    const rows: ParsedImportRow[] = [ok(2, importRow()), ok(3, importRow({ clientName: 'Andere Klant' }))];
    const firstPass = buildTeamImportPreview(rows, []);
    expect(firstPass.newRows).toHaveLength(2);

    const existingAfterFirstImport: ExistingPlacementForImport[] = firstPass.newRows.map((r, i) => ({
      id: `written-${i}`,
      fingerprint: r.fingerprint,
      ownerDisplayName: r.row.ownerDisplayName,
      hoursPerWeek: r.row.hoursPerWeek,
      monthlyDb: r.row.monthlyDb,
    }));

    const secondPass = buildTeamImportPreview(rows, existingAfterFirstImport);
    expect(secondPass.newRows).toHaveLength(0);
    expect(secondPass.changedRows).toHaveLength(0);
    expect(secondPass.unchangedRows).toHaveLength(2);
  });

  it('carries forward row-level parse errors without dropping them silently', () => {
    const preview = buildTeamImportPreview([ok(2, importRow()), err(3, 'Ontbrekend e-mailadres'), err(4, 'Einddatum voor startdatum')], []);
    expect(preview.totalFound).toBe(3);
    expect(preview.errorRows).toEqual([
      { rowNumber: 3, reason: 'Ontbrekend e-mailadres' },
      { rowNumber: 4, reason: 'Einddatum voor startdatum' },
    ]);
  });

  it('summarizes recognized accountmanagers by normalized email with a placement count each', () => {
    const preview = buildTeamImportPreview(
      [
        ok(2, importRow({ ownerEmail: 'Bernard.Drost@Maandag.com', ownerDisplayName: 'Bernard' })),
        ok(3, importRow({ ownerEmail: 'bernard.drost@maandag.com', ownerDisplayName: 'Bernard', clientName: 'Andere Klant' })),
        ok(4, importRow({ ownerEmail: 'lisa@maandag.com', ownerDisplayName: 'Lisa', clientName: 'Weer Andere Klant' })),
      ],
      [],
    );
    expect(preview.accountManagers).toEqual([
      { displayName: 'Bernard', emailNormalized: 'bernard.drost@maandag.com', count: 2 },
      { displayName: 'Lisa', emailNormalized: 'lisa@maandag.com', count: 1 },
    ]);
  });
});
