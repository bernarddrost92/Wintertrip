import { describe, expect, it } from 'vitest';
import { classificationPriority, classifyPlacement, isDoubleOpportunity, isExtensionOpportunity, isTimingOpportunity } from './missionHuntClassification';

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
    expect(classification).toEqual({ isTiming: true, isExtension: true, isDouble: true, isGrey: false });
  });

  it('a placement outside both windows is grey (GEEN DIRECTE GAME-KANS)', () => {
    const classification = classifyPlacement('2026-06-01', '2028-06-30');
    expect(classification).toEqual({ isTiming: false, isExtension: false, isDouble: false, isGrey: true });
  });

  it('timing without extension is a pure timing opportunity, not double', () => {
    const classification = classifyPlacement('2026-10-01', '2028-06-30');
    expect(classification).toEqual({ isTiming: true, isExtension: false, isDouble: false, isGrey: false });
  });

  it('extension without timing is a pure verlengkans, not double', () => {
    const classification = classifyPlacement('2026-06-01', '2026-12-31');
    expect(classification).toEqual({ isTiming: false, isExtension: true, isDouble: false, isGrey: false });
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
