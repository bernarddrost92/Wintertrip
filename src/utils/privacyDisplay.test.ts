import { describe, expect, it } from 'vitest';
import { formatClientLocation, formatDisplayDb, formatProfessionalInitials } from './privacyDisplay';

describe('formatProfessionalInitials', () => {
  it('formats a simple two-part name', () => {
    expect(formatProfessionalInitials('Janny Hakkers')).toBe('J.H.');
  });

  it('drops a lowercase Dutch tussenvoegsel and splits on hyphens', () => {
    const result = formatProfessionalInitials("Ellen 't Hoen-Kemna");
    expect(result).toBe('E.H.K.');
    expect(result).not.toContain('Ellen');
    expect(result).not.toContain('Hoen');
  });

  it('handles a hyphenated middle name', () => {
    expect(formatProfessionalInitials('Jeanette Nuis-De Berg')).toBe('J.N.D.B.');
  });

  it('never leaks the full name', () => {
    expect(formatProfessionalInitials('Bernard Drost')).not.toBe('Bernard Drost');
    expect(formatProfessionalInitials('Bernard Drost')).toBe('B.D.');
  });

  it('is deterministic — same input, same output', () => {
    expect(formatProfessionalInitials('Kim Schuring')).toBe(formatProfessionalInitials('Kim Schuring'));
  });

  it('returns empty string for null/empty', () => {
    expect(formatProfessionalInitials(null)).toBe('');
    expect(formatProfessionalInitials('')).toBe('');
  });
});

describe('formatClientLocation', () => {
  it('extracts the city from a "Gemeente X" client name', () => {
    expect(formatClientLocation('Gemeente Apeldoorn')).toBe('Apeldoorn');
    expect(formatClientLocation('Gemeente Zwolle')).toBe('Zwolle');
  });

  it('never renders the real client name when no city can be derived', () => {
    const result = formatClientLocation('Stichting Katholiek Onderwijs Flevoland-Veluwe');
    expect(result).toBe('LOCATIE ONBEKEND');
    expect(result).not.toContain('Stichting');
    expect(result).not.toContain('Onderwijs');
  });

  it('falls back for null/empty client name, never the real name', () => {
    expect(formatClientLocation(null)).toBe('LOCATIE ONBEKEND');
    expect(formatClientLocation('')).toBe('LOCATIE ONBEKEND');
  });
});

describe('formatDisplayDb', () => {
  it('rounds to the nearest whole number for display', () => {
    expect(formatDisplayDb(14.59)).toBe('15');
    expect(formatDisplayDb(6.02)).toBe('6');
    expect(formatDisplayDb(43.08)).toBe('43');
  });

  it('renders — for null, never a decimal', () => {
    expect(formatDisplayDb(null)).toBe('—');
  });
});
