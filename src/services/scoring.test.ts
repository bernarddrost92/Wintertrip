import { describe, expect, it } from 'vitest';
import {
  applyFactor,
  calculateExtensionScore,
  calculateFactorImpact,
  calculateFactorScenarios,
  calculateHoursIncreaseEligibility,
  calculateHoursIncreaseScore,
  calculateNewPlacementScore,
  evaluateExtensionTiming,
  isLeagueEligibleCategory,
  isNewPlacementWithinLeague,
  validateExtensionWindow,
  validateMissionWindow,
  validateVcdb,
} from './scoring';

/**
 * OFFICIAL scoring model (restored September 2026):
 *
 *   FIXED MONTHLY MISSION VALUE = qualifying duration in months × VCDB/month
 *   BASE LEAGUE SCORE           = FIXED MONTHLY MISSION VALUE × ACTIVE LEAGUE MONTHS
 *
 * The temporary "duration × VCDB, single multiplication, no league-month
 * multiplier" interpretation (Base Score = qualifyingTerm.totalValue alone)
 * has been reverted and is no longer correct — see the regression check at
 * the bottom of this file.
 */

describe('TEST A — new placement starting September: 8 months × VCDB 10 → fixed 80, 5 active league months, base 400', () => {
  it('01-09-2026 t/m 30-04-2027, VCDB 10 -> fixed monthly mission value 80, active league months 5, base score 400', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1, 'DETACHERING');
    expect(result.qualifyingDurationMonths).toBeCloseTo(8, 6);
    expect(result.fixedMonthlyMissionValue).toBeCloseTo(80, 6);
    expect(result.activeLeagueMonths).toBe(5);
    expect(result.baseScore).toBeCloseTo(400, 6);
  });

  it('applies the Factor on top of the base score: base 400, factor 2.5 -> mission value 1000', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 2.5, 'DETACHERING');
    expect(result.baseScore).toBeCloseTo(400, 6);
    expect(result.finalScore).toBeCloseTo(1000, 6);
    expect(result.factorImpact).toBeCloseTo(600, 6);
  });

  it('factor 1.3 on the same base -> 520', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1.3, 'DETACHERING');
    expect(result.baseScore).toBeCloseTo(400, 6);
    expect(result.finalScore).toBeCloseTo(520, 6);
  });

  it('the fixed monthly mission value still uses the full agreed term (Feb/Mar/Apr included in duration) even though only Sep–Jan add league-month multiplier', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1, 'DETACHERING');
    expect(result.qualifyingTerm.segments.map((s) => s.monthKey)).toEqual([
      '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04',
    ]);
    expect(result.activeLeagueMonths).toBe(5); // Feb/Mar/Apr never become active league months
  });
});

describe('TEST B — start October: same deal, one fewer active league month', () => {
  it('01-10-2026, 8 months (t/m 31-05-2027), VCDB 10 -> 80 × 4 = 320', () => {
    const result = calculateNewPlacementScore('2026-10-01', '2027-05-31', 10, 1, 'DETACHERING');
    expect(result.fixedMonthlyMissionValue).toBeCloseTo(80, 6);
    expect(result.activeLeagueMonths).toBe(4);
    expect(result.baseScore).toBeCloseTo(320, 6);
  });
});

describe('TEST C — start November', () => {
  it('01-11-2026, 8 months (t/m 30-06-2027), VCDB 10 -> 80 × 3 = 240', () => {
    const result = calculateNewPlacementScore('2026-11-01', '2027-06-30', 10, 1, 'DETACHERING');
    expect(result.fixedMonthlyMissionValue).toBeCloseTo(80, 6);
    expect(result.activeLeagueMonths).toBe(3);
    expect(result.baseScore).toBeCloseTo(240, 6);
  });
});

describe('TEST D — start December', () => {
  it('01-12-2026, 8 months (t/m 31-07-2027), VCDB 10 -> 80 × 2 = 160', () => {
    const result = calculateNewPlacementScore('2026-12-01', '2027-07-31', 10, 1, 'DETACHERING');
    expect(result.fixedMonthlyMissionValue).toBeCloseTo(80, 6);
    expect(result.activeLeagueMonths).toBe(2);
    expect(result.baseScore).toBeCloseTo(160, 6);
  });
});

describe('TEST E — start January', () => {
  it('01-01-2027, 8 months (t/m 31-08-2027), VCDB 10 -> 80 × 1 = 80', () => {
    const result = calculateNewPlacementScore('2027-01-01', '2027-08-31', 10, 1, 'DETACHERING');
    expect(result.fixedMonthlyMissionValue).toBeCloseTo(80, 6);
    expect(result.activeLeagueMonths).toBe(1);
    expect(result.baseScore).toBeCloseTo(80, 6);
  });
});

describe('TEST F — a placement that already existed before the league does not count as new', () => {
  it('start before league (01-08-2026), no extension -> 0, regardless of how much of its own term overlaps Sep–Jan', () => {
    expect(isNewPlacementWithinLeague('2026-08-01')).toBe(false);
    const result = calculateNewPlacementScore('2026-08-01', '2027-03-31', 10, 2.5, 'DETACHERING');
    expect(result.baseScore).toBe(0);
    expect(result.finalScore).toBe(0);
  });

  it('a start exactly on the league start date (01-09-2026) does count as new', () => {
    expect(isNewPlacementWithinLeague('2026-09-01')).toBe(true);
  });

  it('a start exactly on the league end date (31-01-2027) still counts as new', () => {
    expect(isNewPlacementWithinLeague('2027-01-31')).toBe(true);
  });
});

describe('TEST G — extension: only the newly added term, fixed value × its own active league months', () => {
  it('old end 30-09-2026, new extension 01-10-2026 t/m 31-01-2027, VCDB 10 -> fixed 40 × 4 league months = 160', () => {
    const timing = evaluateExtensionTiming('2026-09-30');
    expect(timing.newTermStart).toBe('2026-10-01');
    expect(timing.qualifies).toBe(true);

    const result = calculateExtensionScore('2026-09-30', '2027-01-31', 10, 1, 'DETACHERING');
    expect(result.qualifyingDurationMonths).toBeCloseTo(4, 6);
    expect(result.fixedMonthlyMissionValue).toBeCloseTo(40, 6);
    expect(result.activeLeagueMonths).toBe(4);
    expect(result.baseScore).toBeCloseTo(160, 6);
  });

  it('the old placement months before the new term start never count again', () => {
    const result = calculateExtensionScore('2026-09-30', '2027-01-31', 10, 1, 'DETACHERING');
    expect(result.qualifyingTerm.segments.map((s) => s.monthKey)).toEqual(['2026-10', '2026-11', '2026-12', '2027-01']);
  });
});

describe('TEST H — hours increase below the +4/week threshold never scores', () => {
  it('+3 u/w -> not eligible, base score and final score both 0', () => {
    const result = calculateHoursIncreaseScore(32, 35, '2026-09-01', '2027-01-31', 8, 2.5, 'DETACHERING');
    expect(result.eligible).toBe(false);
    expect(result.increaseHours).toBeCloseTo(3, 6);
    expect(result.baseScore).toBe(0);
    expect(result.finalScore).toBe(0);
  });
});

describe('TEST I — hours increase at +4/week: eligible, only the extra VCDB scores via the official formula', () => {
  it('+4 u/w, 01-09-2026 t/m 31-01-2027 (5 full months), extra VCDB 8 -> fixed 40 × 5 league months = 200', () => {
    const result = calculateHoursIncreaseScore(32, 36, '2026-09-01', '2027-01-31', 8, 1, 'DETACHERING');
    expect(result.eligible).toBe(true);
    expect(result.qualifyingDurationMonths).toBeCloseTo(5, 6);
    expect(result.fixedMonthlyMissionValue).toBeCloseTo(40, 6);
    expect(result.activeLeagueMonths).toBe(5);
    expect(result.baseScore).toBeCloseTo(200, 6);
  });
});

describe('TEST J — W&S never scores, even inside the official formula', () => {
  it('a W&S new placement scores 0 despite an otherwise perfect window', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 2.5, 'WS');
    expect(result.baseScore).toBe(0);
    expect(result.finalScore).toBe(0);
  });

  it('a W&S extension scores 0 even when the timing would otherwise qualify', () => {
    const result = calculateExtensionScore('2026-09-30', '2027-01-31', 10, 2.5, 'WS');
    expect(result.finalScore).toBe(0);
  });

  it('a W&S hours increase scores 0 even when the hours threshold is met', () => {
    const result = calculateHoursIncreaseScore(20, 28, '2026-09-01', '2027-01-31', 8, 2.5, 'WS');
    expect(result.finalScore).toBe(0);
  });
});

describe('TEST K — factor multiplies the base league score, not the fixed monthly value', () => {
  it('base league score 400, factor 2.5 -> final score 1000', () => {
    expect(applyFactor(400, 2.5)).toBe(1000);
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 2.5, 'DETACHERING');
    expect(result.baseScore).toBeCloseTo(400, 6);
    expect(result.finalScore).toBeCloseTo(1000, 6);
  });
});

describe('regression check — the temporary "duration × VCDB, single multiplication" formula must never resurface', () => {
  it('base score is fixedMonthlyMissionValue × activeLeagueMonths, never fixedMonthlyMissionValue alone', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1, 'DETACHERING');
    expect(result.activeLeagueMonths).toBeGreaterThan(1);
    expect(result.baseScore).toBeCloseTo(result.fixedMonthlyMissionValue * result.activeLeagueMonths, 6);
    expect(result.baseScore).not.toBeCloseTo(result.fixedMonthlyMissionValue, 6);
  });

  it('a mid-month placement (15 Sep – 5 Mar) matches the day-precise fixed value, then multiplies by its active league months', () => {
    const result = calculateNewPlacementScore('2026-09-15', '2027-03-05', 10, 2.5, 'DETACHERING');
    expect(result.fixedMonthlyMissionValue).toBeCloseTo(56.9462, 3);
    expect(result.activeLeagueMonths).toBe(5); // Sep(partial)/Oct/Nov/Dec/Jan — Feb/Mar excluded
    expect(result.baseScore).toBeCloseTo(56.9462 * 5, 2);
    expect(result.finalScore).toBeCloseTo(56.9462 * 5 * 2.5, 1);
  });

  it('a 15 September start still prorates that calendar month to exactly 16/30 for the fixed-value calculation', () => {
    const result = calculateNewPlacementScore('2026-09-15', '2027-03-05', 10, 1, 'DETACHERING');
    const sep = result.qualifyingTerm.segments.find((s) => s.monthKey === '2026-09');
    expect(sep?.fraction).toBeCloseTo(16 / 30, 10);
  });
});

describe('evaluateExtensionTiming — 31 January qualification gate (unchanged)', () => {
  it('new term start is always oldEndDate + 1 day', () => {
    expect(evaluateExtensionTiming('2027-01-31').newTermStart).toBe('2027-02-01');
    expect(evaluateExtensionTiming('2027-01-28').newTermStart).toBe('2027-01-29');
  });

  it('a new term starting on or before 31 January qualifies', () => {
    expect(evaluateExtensionTiming('2027-01-28').qualifies).toBe(true);
    expect(evaluateExtensionTiming('2027-01-30').qualifies).toBe(true); // starts exactly 31 Jan
  });

  it('a new term starting after 31 January does not qualify', () => {
    expect(evaluateExtensionTiming('2027-01-31').qualifies).toBe(false); // starts 1 Feb
    expect(evaluateExtensionTiming('2027-02-15').qualifies).toBe(false);
  });

  it('an extension whose new term starts too late scores 0 outright', () => {
    const result = calculateExtensionScore('2027-01-31', '2027-08-01', 10, 2.5, 'DETACHERING');
    expect(result.baseScore).toBe(0);
    expect(result.finalScore).toBe(0);
  });

  it('rejects an extension whose new end date does not exceed the old one', () => {
    expect(validateExtensionWindow('2027-01-31', '2027-01-31')).toEqual({ valid: false, message: 'NO NEW EXTENSION PERIOD' });
    expect(validateExtensionWindow('2027-01-31', '2026-12-01')).toEqual({ valid: false, message: 'NO NEW EXTENSION PERIOD' });
  });
});

describe('hours increase eligibility threshold (unchanged)', () => {
  it('+2 u/w is not eligible', () => {
    expect(calculateHoursIncreaseEligibility(36, 38).eligible).toBe(false);
  });

  it('+4 u/w is eligible', () => {
    expect(calculateHoursIncreaseEligibility(32, 36).eligible).toBe(true);
  });
});

describe('W&S deal category never scores', () => {
  it('isLeagueEligibleCategory rejects WS and accepts DETACHERING', () => {
    expect(isLeagueEligibleCategory('WS')).toBe(false);
    expect(isLeagueEligibleCategory('DETACHERING')).toBe(true);
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
