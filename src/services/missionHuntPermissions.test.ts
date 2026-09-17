import { describe, expect, it } from 'vitest';
import { isOwnPlacement } from './missionHuntPermissions';

describe('isOwnPlacement', () => {
  it('matches by ownerId when claimed', () => {
    expect(isOwnPlacement({ ownerId: 'user-1', ownerEmail: 'a@x.com' }, 'user-1', 'a@x.com')).toBe(true);
  });

  it('matches by normalized email when unclaimed', () => {
    expect(isOwnPlacement({ ownerId: null, ownerEmail: 'A@X.com' }, 'user-1', 'a@x.com')).toBe(true);
  });

  it('does not match a colleague\'s claimed placement even if emails happen to differ only by claim state', () => {
    expect(isOwnPlacement({ ownerId: 'user-2', ownerEmail: 'a@x.com' }, 'user-1', 'a@x.com')).toBe(false);
  });
});
