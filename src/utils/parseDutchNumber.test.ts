import { describe, expect, it } from 'vitest';
import { parseDutchNumber } from './parseDutchNumber';

describe('parseDutchNumber', () => {
  it('1. converts a Dutch-formatted decimal string to a JS number: "16,5" -> 16.5', () => {
    expect(parseDutchNumber('16,5')).toBe(16.5);
  });

  it('passes a real JS number through unchanged', () => {
    expect(parseDutchNumber(16.5)).toBe(16.5);
    expect(parseDutchNumber(0)).toBe(0);
  });

  it('handles a Dutch thousands separator too: "1.234,5" -> 1234.5', () => {
    expect(parseDutchNumber('1.234,5')).toBe(1234.5);
  });

  it('parses a plain integer string', () => {
    expect(parseDutchNumber('20')).toBe(20);
  });

  it('returns null for null/undefined/empty', () => {
    expect(parseDutchNumber(null)).toBeNull();
    expect(parseDutchNumber(undefined)).toBeNull();
    expect(parseDutchNumber('')).toBeNull();
    expect(parseDutchNumber('   ')).toBeNull();
  });

  it('returns null for unparseable text rather than NaN or 0', () => {
    expect(parseDutchNumber('n/a')).toBeNull();
    expect(parseDutchNumber('DB ontbreekt')).toBeNull();
  });
});
