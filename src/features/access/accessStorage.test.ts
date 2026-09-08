import { afterEach, describe, expect, it } from 'vitest';
import { grantAccess, hasAccess, resetAccess } from './accessStorage';

afterEach(() => {
  localStorage.clear();
});

describe('accessStorage', () => {
  it('has no access by default', () => {
    expect(hasAccess()).toBe(false);
  });

  it('grantAccess persists access under the documented key/value', () => {
    grantAccess();
    expect(hasAccess()).toBe(true);
    expect(localStorage.getItem('wintertrip-access-granted')).toBe('true');
  });

  it('D. persists across a simulated reload (a fresh hasAccess() call still reads true)', () => {
    grantAccess();
    expect(hasAccess()).toBe(true);
    // A "reload" here is just another hasAccess() call — nothing about it
    // is tied to component state, only to what's actually in localStorage.
    expect(hasAccess()).toBe(true);
  });

  it('E. resetAccess clears the stored flag', () => {
    grantAccess();
    expect(hasAccess()).toBe(true);
    resetAccess();
    expect(hasAccess()).toBe(false);
    expect(localStorage.getItem('wintertrip-access-granted')).toBeNull();
  });
});
