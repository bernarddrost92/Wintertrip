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
  validateExtensionWindow,
  validateMissionWindow,
  validateVcdb,
} from './scoring';

describe('TEST A — new placement: Base Score = VCDB per month × full qualifying looptijd', () => {
  it('01-09-2026 t/m 30-04-2027, VCDB 10 -> base score 80 (never 80x5=400)', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1, 'DETACHERING');
    expect(result.qualifyingTerm.segments).toHaveLength(8);
    expect(result.qualifyingTerm.totalValue).toBe(80);
    expect(result.baseScore).toBe(80);
  });

  it('applies the Factor on top of the base score: base 80, factor 2.5 -> mission value 200', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 2.5, 'DETACHERING');
    expect(result.baseScore).toBe(80);
    expect(result.finalScore).toBe(200);
    expect(result.factorImpact).toBe(120);
  });

  it('factor 1.3 on the same base -> 104', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1.3, 'DETACHERING');
    expect(result.baseScore).toBe(80);
    expect(result.finalScore).toBeCloseTo(104, 6);
  });

  it('the full agreed term counts, with no cutoff at the league window (Feb/Mar/Apr all included)', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1, 'DETACHERING');
    expect(result.qualifyingTerm.segments.map((s) => s.monthKey)).toEqual([
      '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04',
    ]);
  });
});

describe('partial-month proration (regression from V2)', () => {
  it('a 15 September start prorates that month to exactly 16/30', () => {
    const result = calculateNewPlacementScore('2026-09-15', '2027-03-05', 10, 1, 'DETACHERING');
    const sep = result.qualifyingTerm.segments.find((s) => s.monthKey === '2026-09');
    expect(sep?.fraction).toBeCloseTo(16 / 30, 10);
  });

  it('an arbitrary mid-month placement (15 Sep - 5 Mar) matches the documented worked example', () => {
    const result = calculateNewPlacementScore('2026-09-15', '2027-03-05', 10, 2.5, 'DETACHERING');
    expect(result.qualifyingTerm.totalValue).toBeCloseTo(56.9462, 3);
    expect(result.baseScore).toBeCloseTo(56.9462, 3);
  });
});

describe('evaluateExtensionTiming — 31 January qualification gate', () => {
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
});

describe('TEST B — extension: old end 31 Jan means the new term starts too late, score 0', () => {
  it('old end 31-01-2027, new end 01-08-2027 -> new term start 01-02-2027 -> score 0', () => {
    const timing = evaluateExtensionTiming('2027-01-31');
    expect(timing.newTermStart).toBe('2027-02-01');
    expect(timing.qualifies).toBe(false);

    const result = calculateExtensionScore('2027-01-31', '2027-08-01', 10, 2.5, 'DETACHERING');
    expect(result.baseScore).toBe(0);
    expect(result.finalScore).toBe(0);
  });
});

describe('TEST C — extension: old end 28 Jan qualifies, and the FULL new term counts through August', () => {
  it('old end 28-01-2027, new end 01-08-2027 -> new term start 29-01-2027 -> qualifies, full period counts', () => {
    const timing = evaluateExtensionTiming('2027-01-28');
    expect(timing.newTermStart).toBe('2027-01-29');
    expect(timing.qualifies).toBe(true);

    const result = calculateExtensionScore('2027-01-28', '2027-08-01', 10, 1, 'DETACHERING');
    expect(result.baseScore).toBeGreaterThan(0);

    // The qualifying term runs the full newly-added period, all the way to 1 August —
    // never truncated at 31 January.
    expect(result.qualifyingTerm.segments.map((s) => s.monthKey)).toEqual([
      '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08',
    ]);

    const jan = result.qualifyingTerm.segments.find((s) => s.monthKey === '2027-01');
    expect(jan?.overlapDays).toBe(3); // 29, 30, 31 January
    expect(jan?.value).toBeCloseTo(3 * (10 / 31), 10);

    const feb = result.qualifyingTerm.segments.find((s) => s.monthKey === '2027-02');
    expect(feb?.fraction).toBe(1);
    expect(feb?.value).toBe(10);

    const aug = result.qualifyingTerm.segments.find((s) => s.monthKey === '2027-08');
    expect(aug?.overlapDays).toBe(1);
    expect(aug?.value).toBeCloseTo(1 * (10 / 31), 10);

    // Matches the worked example in the spec: total base score ~61.29, mission value (x2.5) ~153.23.
    expect(result.baseScore).toBeCloseTo(61.29, 2);

    const withFactor = calculateExtensionScore('2027-01-28', '2027-08-01', 10, 2.5, 'DETACHERING');
    expect(withFactor.finalScore).toBeCloseTo(153.23, 2);
  });

  it('rejects an extension whose new end date does not exceed the old one', () => {
    expect(validateExtensionWindow('2027-01-31', '2027-01-31')).toEqual({ valid: false, message: 'NO NEW EXTENSION PERIOD' });
    expect(validateExtensionWindow('2027-01-31', '2026-12-01')).toEqual({ valid: false, message: 'NO NEW EXTENSION PERIOD' });
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

  it('an eligible hours increase scores using only the extra VCDB, over the full agreed period', () => {
    const result = calculateHoursIncreaseScore(20, 28, '2026-09-01', '2027-01-31', 4, 1, 'DETACHERING');
    expect(result.eligible).toBe(true);
    expect(result.qualifyingTerm.totalValue).toBe(20); // 5 full months x 4
    expect(result.baseScore).toBe(20);
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

  it('a W&S extension scores 0 even when the timing would otherwise qualify', () => {
    const result = calculateExtensionScore('2027-01-28', '2027-08-01', 10, 2.5, 'WS');
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
