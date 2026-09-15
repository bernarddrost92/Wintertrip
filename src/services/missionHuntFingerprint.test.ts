import { describe, expect, it } from 'vitest';
import { buildProjectFingerprint } from './missionHuntFingerprint';

describe('buildProjectFingerprint', () => {
  it('is stable for identical inputs', () => {
    const a = buildProjectFingerprint('owner-1', 'De Meerwaarde', 'Han', 'docent Nederlands');
    const b = buildProjectFingerprint('owner-1', 'De Meerwaarde', 'Han', 'docent Nederlands');
    expect(a).toBe(b);
  });

  it('is case- and whitespace-insensitive (a re-typed duplicate still matches)', () => {
    const a = buildProjectFingerprint('owner-1', 'De Meerwaarde', 'Han', 'docent Nederlands');
    const b = buildProjectFingerprint('owner-1', '  de meerwaarde  ', 'HAN', 'Docent   Nederlands');
    expect(a).toBe(b);
  });

  it('treats a missing professional the same as an empty string', () => {
    const a = buildProjectFingerprint('owner-1', 'Greijdanus', 'Ryan', null);
    const b = buildProjectFingerprint('owner-1', 'Greijdanus', 'Ryan', undefined);
    const c = buildProjectFingerprint('owner-1', 'Greijdanus', 'Ryan', '');
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('differs across owners for the same project/client/professional', () => {
    const a = buildProjectFingerprint('owner-1', 'Greijdanus', 'Ryan', 'Economie');
    const b = buildProjectFingerprint('owner-2', 'Greijdanus', 'Ryan', 'Economie');
    expect(a).not.toBe(b);
  });

  it('differs when the professional differs (same project/client, different placement)', () => {
    const a = buildProjectFingerprint('owner-1', 'Greijdanus', 'Ryan', 'Economie');
    const b = buildProjectFingerprint('owner-1', 'Greijdanus', 'Ryan', 'Wiskunde');
    expect(a).not.toBe(b);
  });
});
