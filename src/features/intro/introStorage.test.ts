import { describe, expect, it } from 'vitest';
import { hasSeenIntro, markIntroSeen } from './introStorage';

describe('introStorage (session-scoped mission-gate flag)', () => {
  it('has not seen the intro on a fresh session', () => {
    expect(hasSeenIntro()).toBe(false);
  });

  it('remembers the intro was seen for the rest of the session', () => {
    expect(hasSeenIntro()).toBe(false);
    markIntroSeen();
    expect(hasSeenIntro()).toBe(true);
  });
});
