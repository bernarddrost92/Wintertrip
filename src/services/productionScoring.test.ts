import { describe, expect, it } from 'vitest';
import { calculateNewPlacementScore } from './scoring';
import { normalizeProductionFeedRecord } from './normalizeProductionFeed';
import { scoreProductionRecord } from './productionScoring';
import type { ProductionFeedRecord } from '../types/productionFeed';
import type { RawProductionFeedRecord } from '../types/productionFeed';

function baseRaw(overrides: Partial<RawProductionFeedRecord> = {}): RawProductionFeedRecord {
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

function record(overrides: Partial<RawProductionFeedRecord> = {}): ProductionFeedRecord {
  return normalizeProductionFeedRecord(baseRaw(overrides));
}

describe('scoreProductionRecord — empty TM', () => {
  it('2/3. an empty Talentmanager is allowed and never blocks scoring', () => {
    const { outcome } = scoreProductionRecord(record({ talentManager: null }));
    expect(outcome.kind).toBe('scored');
    if (outcome.kind === 'scored') {
      expect(outcome.calculatedLeagueScore).toBeCloseTo(80, 5);
    }
  });
});

describe('scoreProductionRecord — reuses the central scoring engine exactly', () => {
  it('8. start/end date + DB produce exactly the same score as calling the calculator engine directly', () => {
    const { outcome } = scoreProductionRecord(record({ startDate: '2026-09-01', endDate: '2027-04-30', monthlyDb: 10 }));
    const direct = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1, 'DETACHERING');
    expect(outcome.kind).toBe('scored');
    if (outcome.kind === 'scored') {
      expect(outcome.calculatedLeagueScore).toBeCloseTo(direct.baseScore, 5);
      expect(outcome.calculatedLeagueScore).toBeCloseTo(80, 5); // 8 full months x 10 DB
    }
  });
});

describe('scoreProductionRecord — sheet verification', () => {
  it('9/verified. calculated score within tolerance of the sheet score reads as verified', () => {
    const { outcome } = scoreProductionRecord(record({ sheetLeagueScore: 80 }));
    expect(outcome.kind).toBe('scored');
    if (outcome.kind === 'scored') expect(outcome.sheetComparison).toBe('verified');
  });

  it('10. a real disagreement beyond the 0.01 tolerance is marked as mismatch', () => {
    const { outcome } = scoreProductionRecord(record({ sheetLeagueScore: 60 }));
    expect(outcome.kind).toBe('scored');
    if (outcome.kind === 'scored') expect(outcome.sheetComparison).toBe('mismatch');
  });

  it('9. no sheet score at all reads as unavailable, not a false mismatch', () => {
    const { outcome } = scoreProductionRecord(record({ sheetLeagueScore: null }));
    expect(outcome.kind).toBe('scored');
    if (outcome.kind === 'scored') expect(outcome.sheetComparison).toBe('unavailable');
  });
});

describe('scoreProductionRecord — SCORING PENDING, never a fake 0', () => {
  it('11. an incomplete/unparseable start date is pending, not scored as 0', () => {
    const { outcome } = scoreProductionRecord(record({ startDate: 'sept' }));
    expect(outcome.kind).toBe('pending');
  });

  it('12. a missing DB is pending, not scored as 0', () => {
    const { outcome } = scoreProductionRecord(record({ monthlyDb: null }));
    expect(outcome.kind).toBe('pending');
  });
});

describe('scoreProductionRecord — Geannuleerd', () => {
  it('13. an explicitly cancelled record is excluded, not pending and not scored', () => {
    const { outcome } = scoreProductionRecord(record({ status: 'Geannuleerd' }));
    expect(outcome.kind).toBe('excluded');
  });

  it('an operational status other than Geannuleerd never excludes a record', () => {
    for (const status of ['aangeboden', 'Missende documenten', 'check Om']) {
      const { outcome } = scoreProductionRecord(record({ status }));
      expect(outcome.kind).toBe('scored');
    }
  });
});

describe('scoreProductionRecord — Verlenging (extension) eligibility gate', () => {
  it('extension qualifies when the new term starts on or before 31 January', () => {
    const { outcome } = scoreProductionRecord(
      record({ dealType: 'Verlenging', startDate: null, oldEndDate: '2027-01-28', endDate: '2027-06-30', sheetLeagueScore: null }),
    );
    expect(outcome.kind).toBe('scored');
    if (outcome.kind === 'scored') expect(outcome.eligible).toBe(true);
  });

  it('extension does not qualify when the new term starts after 31 January — scores 0, not pending', () => {
    const { outcome } = scoreProductionRecord(
      record({ dealType: 'Verlenging', startDate: null, oldEndDate: '2027-01-31', endDate: '2027-06-30', sheetLeagueScore: null }),
    );
    expect(outcome.kind).toBe('scored');
    if (outcome.kind === 'scored') {
      expect(outcome.eligible).toBe(false);
      expect(outcome.calculatedLeagueScore).toBe(0);
    }
  });
});

describe('scoreProductionRecord — Urenuitbreiding threshold', () => {
  it('an hours increase of at least 4/week is eligible', () => {
    const { outcome } = scoreProductionRecord(
      record({ dealType: 'Urenuitbreiding', extraHoursPerWeek: 8, startDate: '2026-11-01', endDate: '2027-01-31', monthlyDb: 5, sheetLeagueScore: null }),
    );
    expect(outcome.kind).toBe('scored');
    if (outcome.kind === 'scored') {
      expect(outcome.eligible).toBe(true);
      expect(outcome.calculatedLeagueScore).toBeCloseTo(15, 5);
    }
  });

  it('an hours increase below 4/week is not eligible — 0 points, still scored (not pending)', () => {
    const { outcome } = scoreProductionRecord(
      record({ dealType: 'Urenuitbreiding', extraHoursPerWeek: 2, startDate: '2026-11-01', endDate: '2027-01-31', monthlyDb: 5, sheetLeagueScore: null }),
    );
    expect(outcome.kind).toBe('scored');
    if (outcome.kind === 'scored') {
      expect(outcome.eligible).toBe(false);
      expect(outcome.calculatedLeagueScore).toBe(0);
    }
  });
});

describe('scoreProductionRecord — W&S never scores', () => {
  it('a W&S deal always scores 0 and is not eligible, regardless of DB', () => {
    const { outcome } = scoreProductionRecord(record({ dealType: 'W&S', monthlyDb: 25, sheetLeagueScore: null }));
    expect(outcome.kind).toBe('scored');
    if (outcome.kind === 'scored') {
      expect(outcome.calculatedLeagueScore).toBe(0);
      expect(outcome.eligible).toBe(false);
    }
  });
});
