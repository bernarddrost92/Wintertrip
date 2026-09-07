import { describe, expect, it } from 'vitest';
import {
  applyFactor,
  calculateExtensionScore,
  calculateFactorImpact,
  calculateFactorScenarios,
  calculateHoursIncreaseEligibility,
  calculateHoursIncreaseScore,
  calculateNewPlacementScore,
  validateExtensionWindow,
  validateMissionWindow,
  validateVcdb,
} from './scoring';

describe('TEST 1 — official example (Sep start, 8 full months, VCDB 10, factor 2.5)', () => {
  it('reproduces qualifying term 80, league exposure 5, base 400, mission value 1000', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 2.5);
    expect(result.qualifyingTerm.totalValue).toBe(80);
    expect(result.leagueExposure.totalExposure).toBe(5);
    expect(result.baseScore).toBe(400);
    expect(result.finalScore).toBe(1000);
    expect(result.factorImpact).toBe(600);
  });
});

describe('TEST 2 — factor 1.3 on the official example', () => {
  it('400 x 1.3 = 520', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1.3);
    expect(result.baseScore).toBe(400);
    expect(result.finalScore).toBeCloseTo(520, 6);
  });
});

describe('TEST 10 — extension: only the newly added term qualifies', () => {
  it('old end 2027-01-31, new end 2027-06-30 -> only Feb-Jun (5 months) qualifies', () => {
    const result = calculateExtensionScore('2027-01-31', '2027-06-30', 10, 1);
    expect(result.qualifyingTerm.segments.map((s) => s.monthKey)).toEqual([
      '2027-02', '2027-03', '2027-04', '2027-05', '2027-06',
    ]);
    expect(result.qualifyingTerm.segments.every((s) => s.fraction === 1)).toBe(true);
    expect(result.qualifyingTerm.totalValue).toBe(50);
    // Entirely after the league ends (31 Jan 2027) -> zero league exposure, zero score.
    expect(result.leagueExposure.totalExposure).toBe(0);
    expect(result.baseScore).toBe(0);
  });

  it('a within-league extension scores only its added, still-open league months', () => {
    // Current end 31 Dec 2026 -> new end 30 Apr 2027: added term is Jan-Apr, of which
    // only January still falls inside the league window.
    const result = calculateExtensionScore('2026-12-31', '2027-04-30', 10, 1);
    expect(result.qualifyingTerm.totalValue).toBe(40); // 4 full months x 10
    expect(result.leagueExposure.totalExposure).toBe(1); // only January
    expect(result.baseScore).toBe(40);
  });
});

describe('TEST 11 & 12 — hours increase eligibility threshold', () => {
  it('TEST 11 — a +2 u/w increase is not eligible', () => {
    expect(calculateHoursIncreaseEligibility(36, 38).eligible).toBe(false);
  });

  it('TEST 12 — a +4 u/w increase is eligible', () => {
    expect(calculateHoursIncreaseEligibility(32, 36).eligible).toBe(true);
  });

  it('an ineligible hours increase scores zero via the full pipeline', () => {
    const result = calculateHoursIncreaseScore(36, 38, '2026-09-01', '2027-01-31', 4, 2.5);
    expect(result.eligible).toBe(false);
    expect(result.finalScore).toBe(0);
  });

  it('an eligible hours increase scores using only the extra VCDB', () => {
    const result = calculateHoursIncreaseScore(20, 28, '2026-09-01', '2027-01-31', 4, 1);
    expect(result.eligible).toBe(true);
    expect(result.qualifyingTerm.totalValue).toBe(20); // 5 full months x 4
    expect(result.leagueExposure.totalExposure).toBe(5);
    expect(result.baseScore).toBe(100);
  });
});

describe('TEST 13 — validation: end date before start date', () => {
  it('flags an inverted mission window instead of computing garbage', () => {
    expect(validateMissionWindow('2027-01-31', '2026-09-01')).toEqual({ valid: false, message: 'INVALID MISSION WINDOW' });
  });

  it('the full calculation pipeline returns a zero result rather than throwing', () => {
    const result = calculateNewPlacementScore('2027-01-31', '2026-09-01', 10, 2.5);
    expect(result.baseScore).toBe(0);
    expect(result.finalScore).toBe(0);
  });

  it('VCDB <= 0 is rejected with ENTER MONTHLY VCDB', () => {
    expect(validateVcdb(0)).toEqual({ valid: false, message: 'ENTER MONTHLY VCDB' });
    expect(validateVcdb(-5)).toEqual({ valid: false, message: 'ENTER MONTHLY VCDB' });
    expect(validateVcdb(1)).toEqual({ valid: true });
  });

  it('an extension whose new end date does not exceed the old one is rejected', () => {
    expect(validateExtensionWindow('2027-01-31', '2027-01-31')).toEqual({ valid: false, message: 'NO NEW EXTENSION PERIOD' });
    expect(validateExtensionWindow('2027-01-31', '2026-12-01')).toEqual({ valid: false, message: 'NO NEW EXTENSION PERIOD' });
  });
});

describe('TEST 14 — factor precision', () => {
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
});

describe('TEST 15 & 16 — placements entirely outside the league window score zero', () => {
  it('TEST 15 — starts after the league ends', () => {
    const result = calculateNewPlacementScore('2027-03-01', '2027-06-30', 10, 2.5);
    expect(result.leagueExposure.totalExposure).toBe(0);
    expect(result.finalScore).toBe(0);
  });

  it('TEST 16 — ends before the league begins', () => {
    const result = calculateNewPlacementScore('2025-01-01', '2026-08-31', 10, 2.5);
    expect(result.leagueExposure.totalExposure).toBe(0);
    expect(result.finalScore).toBe(0);
  });
});

describe('November-start scenario (still holds under the new engine)', () => {
  it('8 full months from 1 Nov -> 3 league months -> base 240, x2.5 -> 600', () => {
    const result = calculateNewPlacementScore('2026-11-01', '2027-06-30', 10, 2.5);
    expect(result.qualifyingTerm.totalValue).toBe(80);
    expect(result.leagueExposure.totalExposure).toBe(3);
    expect(result.baseScore).toBe(240);
    expect(result.finalScore).toBe(600);
  });
});

describe('"without factor" (1.0x) is a true no-op', () => {
  it('final score equals base score', () => {
    const result = calculateNewPlacementScore('2026-09-01', '2027-04-30', 10, 1.0);
    expect(result.finalScore).toBe(result.baseScore);
    expect(result.factorImpact).toBe(0);
  });
});
