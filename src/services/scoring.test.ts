import { describe, expect, it } from 'vitest';
import {
  applyFactor,
  calculateExtensionScore,
  calculateFactorImpact,
  calculateFactorScenarios,
  calculateHoursIncreaseEligibility,
  calculateHoursIncreaseScore,
  calculateNewPlacementScore,
  isLeagueEligibleCategory,
  validateExtensionWindow,
  validateMissionWindow,
  validateVcdb,
} from './scoring';

describe('official example (Sep start, 8 full months, VCDB 10, factor 2.5)', () => {
  it('reproduces qualifying term 80, league exposure 5, base 400, mission value 1000', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 2.5, 'DETACHERING');
    expect(result.qualifyingTerm.totalValue).toBe(80);
    expect(result.leagueExposure.totalExposure).toBe(5);
    expect(result.baseScore).toBe(400);
    expect(result.finalScore).toBe(1000);
    expect(result.factorImpact).toBe(600);
  });

  it('factor 1.3 on the same base -> 520', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1.3, 'DETACHERING');
    expect(result.baseScore).toBe(400);
    expect(result.finalScore).toBeCloseTo(520, 6);
  });
});

describe('partial-month proration (regression from V2)', () => {
  it('a 15 September start prorates that month to exactly 16/30', () => {
    const result = calculateNewPlacementScore('2026-09-15', '2027-03-05', 10, 1, 'DETACHERING');
    const sep = result.leagueExposure.segments.find((s) => s.monthKey === '2026-09');
    expect(sep?.fraction).toBeCloseTo(16 / 30, 10);
  });

  it('an arbitrary mid-month placement (15 Sep - 5 Mar) matches the documented worked example', () => {
    const result = calculateNewPlacementScore('2026-09-15', '2027-03-05', 10, 2.5, 'DETACHERING');
    expect(result.qualifyingTerm.totalValue).toBeCloseTo(56.9462, 3);
    expect(result.leagueExposure.totalExposure).toBeCloseTo(4.5333, 3);
  });
});

describe('extension scoring — Award Date drives League Exposure', () => {
  it('worked example: award 15 Oct, old end 31 Jan, new end 30 Jun, VCDB 10', () => {
    const result = calculateExtensionScore('2027-01-31', '2027-06-30', 10, 1, '2026-10-15', 'DETACHERING');

    // Qualifying term = the added period itself (Feb-Jun), independent of the award date.
    expect(result.qualifyingTerm.segments.map((s) => s.monthKey)).toEqual([
      '2027-02', '2027-03', '2027-04', '2027-05', '2027-06',
    ]);
    expect(result.qualifyingTerm.totalValue).toBe(50);

    // League exposure runs from the award date through league end: Oct(15-31) + Nov + Dec + Jan.
    const byMonth = Object.fromEntries(result.leagueExposure.segments.map((s) => [s.monthKey, s]));
    expect(byMonth['2026-09'].fraction).toBe(0);
    expect(byMonth['2026-10'].overlapDays).toBe(17);
    expect(byMonth['2026-10'].fraction).toBeCloseTo(17 / 31, 10);
    expect(byMonth['2026-11'].fraction).toBe(1);
    expect(byMonth['2026-12'].fraction).toBe(1);
    expect(byMonth['2027-01'].fraction).toBe(1);

    const expectedExposure = 17 / 31 + 3;
    expect(result.leagueExposure.totalExposure).toBeCloseTo(expectedExposure, 10);

    const expectedBase = 50 * expectedExposure;
    expect(result.baseScore).toBeCloseTo(expectedBase, 6);
    expect(result.baseScore).toBeCloseTo(177.419, 2);
  });

  it('an award date after the league has already closed yields zero exposure', () => {
    const result = calculateExtensionScore('2027-01-31', '2027-06-30', 10, 2.5, '2027-02-15', 'DETACHERING');
    expect(result.qualifyingTerm.totalValue).toBe(50); // term value is unaffected by the award date
    expect(result.leagueExposure.totalExposure).toBe(0);
    expect(result.baseScore).toBe(0);
    expect(result.finalScore).toBe(0);
  });

  it('an award date coinciding with the added term start behaves like a same-window new placement', () => {
    const result = calculateExtensionScore('2026-09-30', '2026-11-30', 10, 1, '2026-10-01', 'DETACHERING');
    expect(result.qualifyingTerm.totalValue).toBe(20); // Oct + Nov, full
    expect(result.leagueExposure.totalExposure).toBe(2); // Oct + Nov, full
    expect(result.baseScore).toBe(40);
  });

  it('rejects an extension whose new end date does not exceed the old one', () => {
    expect(validateExtensionWindow('2027-01-31', '2027-01-31')).toEqual({ valid: false, message: 'NO NEW EXTENSION PERIOD' });
    expect(validateExtensionWindow('2027-01-31', '2026-12-01')).toEqual({ valid: false, message: 'NO NEW EXTENSION PERIOD' });
  });

  it('requires a valid award date', () => {
    const result = calculateExtensionScore('2027-01-31', '2027-06-30', 10, 2.5, '', 'DETACHERING');
    expect(result.finalScore).toBe(0);
  });
});

describe('hours increase eligibility threshold', () => {
  it('+2 u/w is not eligible', () => {
    expect(calculateHoursIncreaseEligibility(36, 38).eligible).toBe(false);
  });

  it('+4 u/w is eligible', () => {
    expect(calculateHoursIncreaseEligibility(32, 36).eligible).toBe(true);
  });

  it('an ineligible hours increase scores zero via the full pipeline', () => {
    const result = calculateHoursIncreaseScore(36, 38, '2026-09-01', '2027-01-31', 4, 2.5, 'DETACHERING');
    expect(result.eligible).toBe(false);
    expect(result.finalScore).toBe(0);
  });

  it('an eligible hours increase scores using only the extra VCDB', () => {
    const result = calculateHoursIncreaseScore(20, 28, '2026-09-01', '2027-01-31', 4, 1, 'DETACHERING');
    expect(result.eligible).toBe(true);
    expect(result.qualifyingTerm.totalValue).toBe(20); // 5 full months x 4
    expect(result.leagueExposure.totalExposure).toBe(5);
    expect(result.baseScore).toBe(100);
  });
});

describe('W&S deal category never scores', () => {
  it('isLeagueEligibleCategory rejects WS and accepts DETACHERING', () => {
    expect(isLeagueEligibleCategory('WS')).toBe(false);
    expect(isLeagueEligibleCategory('DETACHERING')).toBe(true);
  });

  it('a W&S new placement scores 0 despite an otherwise perfect window', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 2.5, 'WS');
    expect(result.baseScore).toBe(0);
    expect(result.finalScore).toBe(0);
  });

  it('a W&S extension scores 0', () => {
    const result = calculateExtensionScore('2027-01-31', '2027-06-30', 10, 2.5, '2026-10-15', 'WS');
    expect(result.finalScore).toBe(0);
  });

  it('a W&S hours increase scores 0 even when the hours threshold is met', () => {
    const result = calculateHoursIncreaseScore(20, 28, '2026-09-01', '2027-01-31', 4, 2.5, 'WS');
    expect(result.finalScore).toBe(0);
  });
});

describe('validation: invalid dates and windows', () => {
  it('flags an inverted mission window instead of computing garbage', () => {
    expect(validateMissionWindow('2027-01-31', '2026-09-01')).toEqual({ valid: false, message: 'INVALID MISSION WINDOW' });
  });

  it('the full calculation pipeline returns a zero result rather than throwing', () => {
    const result = calculateNewPlacementScore('2027-01-31', '2026-09-01', 10, 2.5, 'DETACHERING');
    expect(result.baseScore).toBe(0);
    expect(result.finalScore).toBe(0);
  });

  it('VCDB <= 0 is rejected with ENTER MONTHLY VCDB', () => {
    expect(validateVcdb(0)).toEqual({ valid: false, message: 'ENTER MONTHLY VCDB' });
    expect(validateVcdb(-5)).toEqual({ valid: false, message: 'ENTER MONTHLY VCDB' });
    expect(validateVcdb(1)).toEqual({ valid: true });
  });
});

describe('outside the league window scores zero', () => {
  it('starts after the league ends', () => {
    const result = calculateNewPlacementScore('2027-03-01', '2027-06-30', 10, 2.5, 'DETACHERING');
    expect(result.leagueExposure.totalExposure).toBe(0);
    expect(result.finalScore).toBe(0);
  });

  it('ends before the league begins', () => {
    const result = calculateNewPlacementScore('2025-01-01', '2026-08-31', 10, 2.5, 'DETACHERING');
    expect(result.leagueExposure.totalExposure).toBe(0);
    expect(result.finalScore).toBe(0);
  });
});

describe('November-start scenario (still holds under the engine)', () => {
  it('8 full months from 1 Nov -> 3 league months -> base 240, x2.5 -> 600', () => {
    const result = calculateNewPlacementScore('2026-11-01', '2027-06-30', 10, 2.5, 'DETACHERING');
    expect(result.qualifyingTerm.totalValue).toBe(80);
    expect(result.leagueExposure.totalExposure).toBe(3);
    expect(result.baseScore).toBe(240);
    expect(result.finalScore).toBe(600);
  });
});

describe('factor precision and scenarios', () => {
  it('keeps full precision through non-exact binary floats (1.7x, 1.3x)', () => {
    expect(applyFactor(400, 1.7)).toBeCloseTo(680, 6);
    expect(applyFactor(400, 1.3)).toBeCloseTo(520, 6);
    expect(calculateFactorImpact(400, 1.7)).toBeCloseTo(280, 6);
  });

  it('lists every ladder rung against the same base score and flags the selection', () => {
    const scenarios = calculateFactorScenarios(400, 2.5);
    const byValue = Object.fromEntries(scenarios.map((s) => [s.value, s.finalScore]));
    expect(byValue[2.5]).toBe(1000);
    expect(byValue[2.0]).toBe(800);
    expect(byValue[1.7]).toBeCloseTo(680, 6);
    expect(byValue[1.5]).toBe(600);
    expect(byValue[1.4]).toBeCloseTo(560, 6);
    expect(byValue[1.3]).toBeCloseTo(520, 6);
    expect(byValue[1.0]).toBe(400);
    expect(scenarios.find((s) => s.value === 2.5)?.isSelected).toBe(true);
  });

  it('"without factor" (1.0x) is a true no-op', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1.0, 'DETACHERING');
    expect(result.finalScore).toBe(result.baseScore);
    expect(result.factorImpact).toBe(0);
  });
});
