import { describe, expect, it } from 'vitest';
import {
  calculatedWeeklyHours,
  classificationPriority,
  classifyPlacement,
  isDoubleOpportunity,
  isExtensionOpportunity,
  isTimingOpportunity,
  isUrenkansOpportunity,
} from './missionHuntClassification';

describe('isTimingOpportunity', () => {
  it('01-09-2026 is NOT a timing opportunity (September already counts as the opening day)', () => {
    expect(isTimingOpportunity('2026-09-01')).toBe(false);
  });
  it('01-10-2026 is a timing opportunity', () => {
    expect(isTimingOpportunity('2026-10-01')).toBe(true);
  });
  it('01-11-2026 is a timing opportunity', () => {
    expect(isTimingOpportunity('2026-11-01')).toBe(true);
  });
  it('01-12-2026 is a timing opportunity', () => {
    expect(isTimingOpportunity('2026-12-01')).toBe(true);
  });
  it('01-01-2027 is a timing opportunity', () => {
    expect(isTimingOpportunity('2027-01-01')).toBe(true);
  });
  it('01-02-2027 is NOT a timing opportunity (past the qualifying window)', () => {
    expect(isTimingOpportunity('2027-02-01')).toBe(false);
  });
  it('a mid-month start is never a timing opportunity', () => {
    expect(isTimingOpportunity('2026-10-15')).toBe(false);
  });
});

describe('isExtensionOpportunity', () => {
  it('31-08-2026 is NOT an extension (before the sales-game period starts)', () => {
    expect(isExtensionOpportunity('2026-08-31')).toBe(false);
  });
  it('01-09-2026 IS an extension (the period\'s own first day)', () => {
    expect(isExtensionOpportunity('2026-09-01')).toBe(true);
  });
  it('31-01-2027 IS an extension (the period\'s own last day)', () => {
    expect(isExtensionOpportunity('2027-01-31')).toBe(true);
  });
  it('01-02-2027 is NOT an extension (past the period)', () => {
    expect(isExtensionOpportunity('2027-02-01')).toBe(false);
  });
});

describe('isDoubleOpportunity / classifyPlacement', () => {
  it('01-10-2026 through 31-12-2026 is a double opportunity', () => {
    expect(isDoubleOpportunity('2026-10-01', '2026-12-31')).toBe(true);
    const classification = classifyPlacement('2026-10-01', '2026-12-31');
    expect(classification).toEqual({ isTiming: true, isExtension: true, isDouble: true, isGrey: false, isUrenkans: false });
  });

  it('a placement outside both windows is grey (GEEN DIRECTE GAME-KANS)', () => {
    const classification = classifyPlacement('2026-06-01', '2028-06-30');
    expect(classification).toEqual({ isTiming: false, isExtension: false, isDouble: false, isGrey: true, isUrenkans: false });
  });

  it('timing without extension is a pure timing opportunity, not double', () => {
    const classification = classifyPlacement('2026-10-01', '2028-06-30');
    expect(classification).toEqual({ isTiming: true, isExtension: false, isDouble: false, isGrey: false, isUrenkans: false });
  });

  it('extension without timing is a pure verlengkans, not double', () => {
    const classification = classifyPlacement('2026-06-01', '2026-12-31');
    expect(classification).toEqual({ isTiming: false, isExtension: true, isDouble: false, isGrey: false, isUrenkans: false });
  });
});

describe('isUrenkansOpportunity', () => {
  it('1.0 FTE -> false', () => {
    expect(isUrenkansOpportunity(1.0)).toBe(false);
  });
  it('0.9 FTE -> false', () => {
    expect(isUrenkansOpportunity(0.9)).toBe(false);
  });
  it('0.8 FTE -> false (exactly the threshold, strict < only)', () => {
    expect(isUrenkansOpportunity(0.8)).toBe(false);
  });
  it('0.79 FTE -> true', () => {
    expect(isUrenkansOpportunity(0.79)).toBe(true);
  });
  it('0.7999 FTE -> true', () => {
    expect(isUrenkansOpportunity(0.7999)).toBe(true);
  });
  it('0.7 FTE -> true', () => {
    expect(isUrenkansOpportunity(0.7)).toBe(true);
  });
  it('0.4 FTE -> true', () => {
    expect(isUrenkansOpportunity(0.4)).toBe(true);
  });
  it('null -> false', () => {
    expect(isUrenkansOpportunity(null)).toBe(false);
  });
  it('0 FTE -> false (invalid/missing data, never a false opportunity)', () => {
    expect(isUrenkansOpportunity(0)).toBe(false);
  });
  it('a negative FTE -> false', () => {
    expect(isUrenkansOpportunity(-0.5)).toBe(false);
  });
  it('FTE > 1 -> false', () => {
    expect(isUrenkansOpportunity(1.2)).toBe(false);
  });
});

describe('calculatedWeeklyHours', () => {
  it.each([
    [0.4, 16],
    [0.6, 24],
    [0.7, 28],
    [0.75, 30],
    [1.0, 40],
  ])('%s FTE -> %s uur', (fte, hours) => {
    expect(calculatedWeeklyHours(fte)).toBe(hours);
  });

  it('null FTE -> null', () => {
    expect(calculatedWeeklyHours(null)).toBeNull();
  });
});

describe('classifyPlacement — URENKANS combinations (additive, never replacing the others)', () => {
  it('VERLENGKANS + URENKANS', () => {
    const classification = classifyPlacement('2026-06-01', '2026-12-31', 0.4);
    expect(classification).toEqual({ isTiming: false, isExtension: true, isDouble: false, isGrey: false, isUrenkans: true });
  });

  it('TIMINGKANS + URENKANS', () => {
    const classification = classifyPlacement('2026-10-01', '2028-06-30', 0.7);
    expect(classification).toEqual({ isTiming: true, isExtension: false, isDouble: false, isGrey: false, isUrenkans: true });
  });

  it('DOUBLE OPPORTUNITY + URENKANS', () => {
    const classification = classifyPlacement('2026-10-01', '2026-12-31', 0.79);
    expect(classification).toEqual({ isTiming: true, isExtension: true, isDouble: true, isGrey: false, isUrenkans: true });
  });

  it('GEEN DIRECTE GAME-KANS + URENKANS (grey and urenkans are independent)', () => {
    const classification = classifyPlacement('2026-06-01', '2028-06-30', 0.4);
    expect(classification).toEqual({ isTiming: false, isExtension: false, isDouble: false, isGrey: true, isUrenkans: true });
  });

  it('omitting hoursPerWeek defaults to no URENKANS', () => {
    const classification = classifyPlacement('2026-10-01', '2026-12-31');
    expect(classification.isUrenkans).toBe(false);
  });
});

describe('classificationPriority', () => {
  it('orders double first, then extension, then timing, then grey', () => {
    const double = classifyPlacement('2026-10-01', '2026-12-31');
    const extensionOnly = classifyPlacement('2026-06-01', '2026-12-31');
    const timingOnly = classifyPlacement('2026-10-01', '2028-06-30');
    const grey = classifyPlacement('2026-06-01', '2028-06-30');

    expect(classificationPriority(double)).toBe(0);
    expect(classificationPriority(extensionOnly)).toBe(1);
    expect(classificationPriority(timingOnly)).toBe(2);
    expect(classificationPriority(grey)).toBe(3);
  });
});
