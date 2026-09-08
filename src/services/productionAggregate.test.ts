import { describe, expect, it } from 'vitest';
import { getAmContribution, getProductionDataQuality, getTeamTotal, getTmContribution } from './productionAggregate';
import { normalizeProductionFeedRecord } from './normalizeProductionFeed';
import { scoreProductionFeed } from './productionScoring';
import type { RawProductionFeedRecord } from '../types/productionFeed';

function raw(overrides: Partial<RawProductionFeedRecord>): RawProductionFeedRecord {
  return {
    id: 'deal-x',
    agreementType: 'Detachering',
    dealType: 'Nieuwe plaatsing',
    startDate: '2026-09-01',
    oldEndDate: null,
    endDate: '2027-04-30',
    accountManager: 'KS',
    talentManager: 'BVM',
    domain: 'Overheid',
    monthlyDb: 10,
    extraHoursPerWeek: null,
    status: 'aangeboden',
    sheetQualifyingStart: '2026-09-01',
    sheetEligible: 'WAAR',
    sheetLeagueScore: 80,
    sheetControl: 'OK',
    ...overrides,
  };
}

describe('production aggregation — no double-counting, correct attribution', () => {
  it('5. the AM gets the deal score', () => {
    const scored = scoreProductionFeed([raw({ id: 'a', accountManager: 'KS', talentManager: 'BVM' })].map(normalizeProductionFeedRecord));
    const am = getAmContribution(scored);
    expect(am).toEqual([{ code: 'KS', score: 80, deals: 1 }]);
  });

  it('6. the TM gets the exact same attribution score as the AM for the same deal', () => {
    const scored = scoreProductionFeed([raw({ id: 'a', accountManager: 'KS', talentManager: 'BVM' })].map(normalizeProductionFeedRecord));
    const am = getAmContribution(scored);
    const tm = getTmContribution(scored);
    expect(am[0].score).toBe(80);
    expect(tm[0].score).toBe(80);
    expect(tm[0].code).toBe('BVM');
  });

  it('4. an empty Talentmanager never appears on the TM leaderboard', () => {
    const scored = scoreProductionFeed(
      [raw({ id: 'a', accountManager: 'KS', talentManager: null })].map(normalizeProductionFeedRecord),
    );
    const tm = getTmContribution(scored);
    expect(tm).toEqual([]);
    // ...but the AM side is unaffected — empty TM never blocks AM attribution.
    expect(getAmContribution(scored)).toEqual([{ code: 'KS', score: 80, deals: 1 }]);
  });

  it('7. Team Zwolle counts a deal exactly once — never AM-sum + TM-sum', () => {
    const scored = scoreProductionFeed(
      [
        raw({ id: 'a', accountManager: 'KS', talentManager: 'BVM', monthlyDb: 10 }),
        raw({ id: 'b', accountManager: 'BD', talentManager: 'RP', monthlyDb: 20, sheetLeagueScore: null }),
      ].map(normalizeProductionFeedRecord),
    );
    const team = getTeamTotal(scored);
    const amTotal = getAmContribution(scored).reduce((sum, a) => sum + a.score, 0);
    const tmTotal = getTmContribution(scored).reduce((sum, t) => sum + t.score, 0);

    expect(team.totalBaseLeaguePoints).toBe(amTotal);
    expect(team.totalBaseLeaguePoints).toBe(tmTotal);
    expect(team.totalBaseLeaguePoints).not.toBe(amTotal + tmTotal);
  });

  it('excluded (Geannuleerd) deals never count toward the team total or any leaderboard', () => {
    const scored = scoreProductionFeed(
      [
        raw({ id: 'a', accountManager: 'KS', talentManager: 'BVM', monthlyDb: 10, sheetLeagueScore: 80 }),
        raw({ id: 'b', accountManager: 'KS', talentManager: 'BVM', monthlyDb: 999, status: 'Geannuleerd', sheetLeagueScore: null }),
      ].map(normalizeProductionFeedRecord),
    );
    const team = getTeamTotal(scored);
    expect(team.totalBaseLeaguePoints).toBe(80);
    expect(getAmContribution(scored)).toEqual([{ code: 'KS', score: 80, deals: 1 }]);
  });

  it('pending deals never count toward the total and are reported separately', () => {
    const scored = scoreProductionFeed(
      [
        raw({ id: 'a', accountManager: 'KS', monthlyDb: 10, sheetLeagueScore: 80 }),
        raw({ id: 'b', accountManager: 'BD', monthlyDb: null, sheetLeagueScore: null }),
      ].map(normalizeProductionFeedRecord),
    );
    const team = getTeamTotal(scored);
    expect(team.totalBaseLeaguePoints).toBe(80);
    expect(team.scoringPending).toBe(1);
  });

  it('10. a sheet/calculated mismatch is counted in data quality', () => {
    const scored = scoreProductionFeed([raw({ id: 'a', sheetLeagueScore: 60 })].map(normalizeProductionFeedRecord));
    expect(getProductionDataQuality(scored).scoringMismatchCount).toBe(1);
  });

  it('AM/TM leaderboards sort highest score first', () => {
    const scored = scoreProductionFeed(
      [
        raw({ id: 'a', accountManager: 'BD', monthlyDb: 5, sheetLeagueScore: null }),
        raw({ id: 'b', accountManager: 'KS', monthlyDb: 20, sheetLeagueScore: null }),
      ].map(normalizeProductionFeedRecord),
    );
    const am = getAmContribution(scored);
    expect(am[0].code).toBe('KS');
    expect(am[1].code).toBe('BD');
  });
});
