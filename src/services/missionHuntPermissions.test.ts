import { describe, expect, it } from 'vitest';
import { canEditPlacement, isOwnPlacement } from './missionHuntPermissions';

describe('canEditPlacement', () => {
  it('a member can edit their own claimed placement', () => {
    expect(canEditPlacement({ ownerId: 'user-1', ownerEmail: 'a@x.com' }, 'user-1', 'a@x.com', 'member')).toBe(true);
  });

  it('a member cannot edit a colleague\'s claimed placement', () => {
    expect(canEditPlacement({ ownerId: 'user-2', ownerEmail: 'b@x.com' }, 'user-1', 'a@x.com', 'member')).toBe(false);
  });

  it('a member can edit an unclaimed placement matching their own email (case/whitespace-insensitive)', () => {
    expect(canEditPlacement({ ownerId: null, ownerEmail: ' A@X.com ' }, 'user-1', 'a@x.com', 'member')).toBe(true);
  });

  it('a member cannot edit an unclaimed placement belonging to a different email', () => {
    expect(canEditPlacement({ ownerId: null, ownerEmail: 'b@x.com' }, 'user-1', 'a@x.com', 'member')).toBe(false);
  });

  it('an admin can edit any placement, claimed or not, their own or a colleague\'s', () => {
    expect(canEditPlacement({ ownerId: 'user-2', ownerEmail: 'b@x.com' }, 'user-1', 'a@x.com', 'admin')).toBe(true);
    expect(canEditPlacement({ ownerId: null, ownerEmail: 'b@x.com' }, 'user-1', 'a@x.com', 'admin')).toBe(true);
  });
});

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
