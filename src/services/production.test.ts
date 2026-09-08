import { describe, expect, it } from 'vitest';
import { MANUAL_SNAPSHOT_RECORDS } from '../data/production/manualMarreSnapshot';
import { getAmProduction, getProductionDataQuality, getTeamProduction, getTmProduction } from './production';
import type { ProductionRecord } from '../types/production';

const records = MANUAL_SNAPSHOT_RECORDS;

function byCode<T extends { code: string }>(code: string, rows: T[]): T {
  const row = rows.find((r) => r.code === code);
  if (!row) throw new Error(`No row for ${code}`);
  return row;
}

describe('getTeamProduction — Team Zwolle totals, no double-counting', () => {
  it('A. counts every unique record once: 10 placements', () => {
    expect(getTeamProduction(records).placementCount).toBe(10);
  });

  it('B. sums known DB across all 10 records: 144.0', () => {
    expect(getTeamProduction(records).knownDb).toBeCloseTo(144.0, 5);
  });

  it('C. counts the one record with no DB figure yet: missingDbCount = 1', () => {
    expect(getTeamProduction(records).missingDbCount).toBe(1);
  });

  it('K. AM + TM attribution does not double Team Zwolle totals — production/AM/TM totals stay independent', () => {
    const team = getTeamProduction(records);
    const amTotal = getAmProduction(records).reduce((sum, a) => sum + a.knownDb, 0);
    const tm = getTmProduction(records);
    const tmTotal = tm.agents.reduce((sum, a) => sum + a.knownDb, 0) + tm.unassigned.knownDb;

    // The AM view and TM view are each their own full partition of the
    // same 10 records — both equal the team total on their own — but nothing
    // ever adds amTotal + tmTotal together to inflate Team Zwolle's figure.
    expect(amTotal).toBeCloseTo(team.knownDb, 5);
    expect(tmTotal).toBeCloseTo(team.knownDb, 5);
    expect(team.placementCount).toBe(10);
  });
});

describe('getAmProduction — Accountmanager contribution', () => {
  const am = getAmProduction(records);

  it('D. KS: 3 placements, 44.5 known DB', () => {
    const ks = byCode('KS', am);
    expect(ks.placementCount).toBe(3);
    expect(ks.knownDb).toBeCloseTo(44.5, 5);
  });

  it('E. BD: 2 placements, 38 known DB', () => {
    const bd = byCode('BD', am);
    expect(bd.placementCount).toBe(2);
    expect(bd.knownDb).toBeCloseTo(38, 5);
  });

  it('F. HH: 2 placements, 31 known DB', () => {
    const hh = byCode('HH', am);
    expect(hh.placementCount).toBe(2);
    expect(hh.knownDb).toBeCloseTo(31, 5);
  });

  it('SB has 1 placement with DB pending, never treated as 0', () => {
    const sb = byCode('SB', am);
    expect(sb.placementCount).toBe(1);
    expect(sb.knownDb).toBe(0);
    expect(sb.missingDbCount).toBe(1);
  });

  it('is sorted by known DB, highest first', () => {
    for (let i = 1; i < am.length; i++) {
      expect(am[i - 1].knownDb).toBeGreaterThanOrEqual(am[i].knownDb);
    }
  });
});

describe('getTmProduction — Talentmanager contribution + unassigned', () => {
  const tm = getTmProduction(records);

  it('G. BVM: 2 placements, 30.5 DB', () => {
    const bvm = byCode('BVM', tm.agents);
    expect(bvm.placementCount).toBe(2);
    expect(bvm.knownDb).toBeCloseTo(30.5, 5);
  });

  it('H. RP: 1 placement, 18 DB', () => {
    const rp = byCode('RP', tm.agents);
    expect(rp.placementCount).toBe(1);
    expect(rp.knownDb).toBeCloseTo(18, 5);
  });

  it('I. SM: 2 placements, 13 known DB, 1 DB missing', () => {
    const sm = byCode('SM', tm.agents);
    expect(sm.placementCount).toBe(2);
    expect(sm.knownDb).toBeCloseTo(13, 5);
    expect(sm.missingDbCount).toBe(1);
  });

  it('YK: 1 placement, 12 DB', () => {
    const yk = byCode('YK', tm.agents);
    expect(yk.placementCount).toBe(1);
    expect(yk.knownDb).toBeCloseTo(12, 5);
  });

  it('J. 4 records without a Talentmanager: unassignedTmCount = 4, known DB = 70.5', () => {
    expect(tm.unassigned.placementCount).toBe(4);
    expect(tm.unassigned.knownDb).toBeCloseTo(70.5, 5);
  });

  it('never folds the unassigned bucket into the ranked TM list', () => {
    expect(tm.agents.some((a) => a.code === 'UNASSIGNED' || a.code === '')).toBe(false);
  });
});

describe('getProductionDataQuality', () => {
  const quality = getProductionDataQuality(records);

  it('reports 4 missing Talentmanagers', () => {
    expect(quality.missingTmCount).toBe(4);
  });

  it('reports 1 missing DB figure', () => {
    expect(quality.missingDbCount).toBe(1);
  });

  it('flags the two records with a defensive date-quality issue', () => {
    expect(quality.dateCheckCount).toBe(2);
  });
});

describe('defensive behaviour on hypothetical bad input', () => {
  it('never coerces a missing DB to 0 in team, AM or TM aggregates', () => {
    const only: ProductionRecord[] = [{ id: 'x', accountManager: 'ZZ', talentManager: null, db: null, dateQuality: 'ok' }];
    expect(getTeamProduction(only).knownDb).toBe(0);
    expect(getTeamProduction(only).missingDbCount).toBe(1);
    expect(getAmProduction(only)[0].knownDb).toBe(0);
    expect(getAmProduction(only)[0].missingDbCount).toBe(1);
  });
});
