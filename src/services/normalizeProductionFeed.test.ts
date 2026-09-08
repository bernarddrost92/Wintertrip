import { describe, expect, it } from 'vitest';
import { normalizeProductionFeedRecord } from './normalizeProductionFeed';
import type { RawProductionFeedRecord } from '../types/productionFeed';

function raw(overrides: Partial<RawProductionFeedRecord> = {}): RawProductionFeedRecord {
  return { id: 'deal-x', ...overrides };
}

describe('normalizeProductionFeedRecord', () => {
  it('1. parses a Dutch-decimal DB string to a real number', () => {
    expect(normalizeProductionFeedRecord(raw({ monthlyDb: '16,5' })).monthlyDb).toBe(16.5);
  });

  it('recognizes the Dutch deal-type labels', () => {
    expect(normalizeProductionFeedRecord(raw({ dealType: 'Nieuwe plaatsing' })).dealType).toBe('NIEUWE_PLAATSING');
    expect(normalizeProductionFeedRecord(raw({ dealType: 'Verlenging' })).dealType).toBe('VERLENGING');
    expect(normalizeProductionFeedRecord(raw({ dealType: 'Urenuitbreiding' })).dealType).toBe('URENUITBREIDING');
    expect(normalizeProductionFeedRecord(raw({ dealType: 'W&S' })).dealType).toBe('WS');
  });

  it('an unrecognized deal type normalizes to null rather than a guess', () => {
    expect(normalizeProductionFeedRecord(raw({ dealType: 'iets anders' })).dealType).toBeNull();
  });

  it('an invalid/incomplete date string normalizes to null, never silently corrected', () => {
    expect(normalizeProductionFeedRecord(raw({ startDate: 'sept' })).startDate).toBeNull();
    expect(normalizeProductionFeedRecord(raw({ startDate: '2026-09-01' })).startDate).toBe('2026-09-01');
  });

  it('blank strings normalize to null, not empty strings', () => {
    const result = normalizeProductionFeedRecord(raw({ accountManager: '   ', talentManager: '' }));
    expect(result.accountManager).toBeNull();
    expect(result.talentManager).toBeNull();
  });

  it('never carries a professional/client name field — the raw shape has none to normalize', () => {
    const result = normalizeProductionFeedRecord(raw({ accountManager: 'KS', talentManager: 'BVM' }));
    expect(Object.keys(result)).not.toContain('professional');
    expect(Object.keys(result)).not.toContain('client');
  });
});
