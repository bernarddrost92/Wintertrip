import { describe, expect, it } from 'vitest';
import {
  applyFactor,
  calculateExtensionScore,
  calculateFactorComparison,
  calculateFactorImpact,
  calculateHoursIncreaseScore,
  calculateScoreBreakdown,
  calculateTimingScenarios,
  isNonScoringDomain,
  validateHoursIncrease,
} from './scoring';
import { calculateDurationMonths, calculateLeagueMonths } from '../utils/dates';
import { LEAGUE_PERIOD } from '../config/scoringConfig';

describe('date math', () => {
  it('computes an 8 month duration from 1 Sep 2026 to 30 Apr 2027', () => {
    expect(calculateDurationMonths('2026-09-01', '2027-04-30')).toBe(8);
  });

  it('computes 5 league months for Sep–Jan overlap', () => {
    expect(calculateLeagueMonths('2026-09-01', '2027-04-30', LEAGUE_PERIOD.start, LEAGUE_PERIOD.end)).toBe(5);
  });

  it('computes 3 league months for a Nov start (Nov, Dec, Jan)', () => {
    expect(calculateLeagueMonths('2026-11-01', '2027-06-30', LEAGUE_PERIOD.start, LEAGUE_PERIOD.end)).toBe(3);
  });

  it('returns 0 league months for a placement entirely before the league', () => {
    expect(calculateLeagueMonths('2025-01-01', '2026-08-31', LEAGUE_PERIOD.start, LEAGUE_PERIOD.end)).toBe(0);
  });

  it('returns 0 league months for a placement entirely after the league', () => {
    expect(calculateLeagueMonths('2027-03-01', '2027-12-31', LEAGUE_PERIOD.start, LEAGUE_PERIOD.end)).toBe(0);
  });
});

describe('CASE 1 — September start', () => {
  it('8 months × 10 VCDB × 5 league-months = 400 base score', () => {
    const breakdown = calculateScoreBreakdown('2026-09-01', '2027-04-30', 10, 1);
    expect(breakdown.durationMonths).toBe(8);
    expect(breakdown.leagueMonths).toBe(5);
    expect(breakdown.scorePerLeagueMonth).toBe(80);
    expect(breakdown.baseScore).toBe(400);
  });
});

describe('CASE 2 — November start', () => {
  it('8 months × 10 VCDB × 3 league-months = 240 base score', () => {
    const breakdown = calculateScoreBreakdown('2026-11-01', '2027-06-30', 10, 1);
    expect(breakdown.durationMonths).toBe(8);
    expect(breakdown.leagueMonths).toBe(3);
    expect(breakdown.baseScore).toBe(240);
  });
});

describe('CASE 3 — factor 2.5 on base 400', () => {
  it('400 × 2.5 = 1000', () => {
    expect(applyFactor(400, 2.5)).toBe(1000);
  });
});

describe('CASE 4 — factor 1.3 on base 400', () => {
  it('400 × 1.3 = 520', () => {
    expect(applyFactor(400, 1.3)).toBeCloseTo(520, 5);
  });
});

describe('CASE 5 — factor 2.5 on base 240', () => {
  it('240 × 2.5 = 600', () => {
    expect(applyFactor(240, 2.5)).toBe(600);
  });
});

describe('CASE 6 — hours increase below threshold', () => {
  it('+2 u/w is not scoreable', () => {
    const result = validateHoursIncrease(36, 38);
    expect(result.valid).toBe(false);
    expect(result.increaseHours).toBe(2);
  });
});

describe('CASE 7 — hours increase at threshold', () => {
  it('+4 u/w is scoreable', () => {
    const result = validateHoursIncrease(32, 36);
    expect(result.valid).toBe(true);
    expect(result.increaseHours).toBe(4);
  });
});

describe('factor impact', () => {
  it('reports +600 impact for factor 2.5 on base 400', () => {
    expect(calculateFactorImpact(400, 2.5)).toBe(600);
  });

  it('reports 0 impact with no factor (1.0x)', () => {
    expect(calculateFactorImpact(400, 1.0)).toBe(0);
  });
});

describe('factor comparison table', () => {
  it('lists every ladder rung against a base score of 400 and flags the selection', () => {
    const rows = calculateFactorComparison(400, 2.5);
    const byValue = Object.fromEntries(rows.map((r) => [r.value, r.finalScore]));
    expect(byValue[2.5]).toBe(1000);
    expect(byValue[2.0]).toBe(800);
    expect(byValue[1.7]).toBeCloseTo(680, 5);
    expect(byValue[1.5]).toBe(600);
    expect(byValue[1.4]).toBeCloseTo(560, 5);
    expect(byValue[1.3]).toBeCloseTo(520, 5);
    expect(byValue[1.0]).toBe(400);
    expect(rows.find((r) => r.value === 2.5)?.isSelected).toBe(true);
    expect(rows.find((r) => r.value === 1.3)?.isSelected).toBe(false);
  });
});

describe('timing impact scenarios', () => {
  it('matches the official example table for an 8-month / 10-VCDB deal', () => {
    const scenarios = calculateTimingScenarios(8, 10);
    const byMonth = Object.fromEntries(scenarios.map((s) => [s.monthLabel, s.baseScore]));
    expect(byMonth.SEP).toBe(400);
    expect(byMonth.OKT).toBe(320);
    expect(byMonth.NOV).toBe(240);
    expect(byMonth.DEC).toBe(160);
    expect(byMonth.JAN).toBe(80);
    expect(scenarios).toHaveLength(5);
  });
});

describe('extension scoring', () => {
  it('only counts the newly added months after the current end date', () => {
    const breakdown = calculateExtensionScore('2026-12-31', '2027-04-30', 10, 1);
    expect(breakdown).not.toBeNull();
    // Added period: 2027-01-01 → 2027-04-30 = 4 months, all inside the league.
    expect(breakdown!.durationMonths).toBe(4);
    expect(breakdown!.leagueMonths).toBe(1); // only January still falls in the league
    expect(breakdown!.baseScore).toBe(40);
  });

  it('returns null when the new end date is not later than the current one', () => {
    expect(calculateExtensionScore('2027-01-31', '2027-01-31', 10, 1)).toBeNull();
    expect(calculateExtensionScore('2027-01-31', '2026-12-01', 10, 1)).toBeNull();
  });
});

describe('hours increase scoring', () => {
  it('scores the incremental VCDB when the increase clears the threshold', () => {
    const result = calculateHoursIncreaseScore(20, 28, '2026-09-01', '2027-01-31', 4, 1);
    expect(result.valid).toBe(true);
    expect(result.breakdown).not.toBeNull();
    expect(result.breakdown!.leagueMonths).toBe(5);
  });

  it('returns no breakdown when the increase is below the threshold', () => {
    const result = calculateHoursIncreaseScore(20, 22, '2026-09-01', '2027-01-31', 4, 1);
    expect(result.valid).toBe(false);
    expect(result.breakdown).toBeNull();
  });
});

describe('W&S guard', () => {
  it('flags W&S as a non-scoring domain', () => {
    expect(isNonScoringDomain('W&S')).toBe(true);
    expect(isNonScoringDomain('Onderwijs')).toBe(false);
    expect(isNonScoringDomain(undefined)).toBe(false);
  });
});

describe('edge cases', () => {
  it('returns a zero breakdown for an empty/invalid date range', () => {
    const breakdown = calculateScoreBreakdown('', '', 10, 2.5);
    expect(breakdown.durationMonths).toBe(0);
    expect(breakdown.leagueMonths).toBe(0);
    expect(breakdown.baseScore).toBe(0);
    expect(breakdown.finalScore).toBe(0);
  });

  it('never produces a negative score from a negative VCDB input', () => {
    const breakdown = calculateScoreBreakdown('2026-09-01', '2027-04-30', -10, 2.5);
    expect(breakdown.baseScore).toBe(0);
  });

  it('treats "without factor" (1.0x) as a true no-op', () => {
    const breakdown = calculateScoreBreakdown('2026-09-01', '2027-04-30', 10, 1.0);
    expect(breakdown.finalScore).toBe(breakdown.baseScore);
  });
});
