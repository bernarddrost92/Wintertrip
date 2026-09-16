import { describe, expect, it } from 'vitest';
import { canEditPlacement, canManageAllPlacements, canManageTalentManagerAssignments, canViewTeamOverview, isOwnPlacement } from './missionHuntPermissions';

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

  it('a manager or office_manager can edit any placement, matching their broadened RLS write policy', () => {
    expect(canEditPlacement({ ownerId: 'user-2', ownerEmail: 'b@x.com' }, 'user-1', 'a@x.com', 'manager')).toBe(true);
    expect(canEditPlacement({ ownerId: 'user-2', ownerEmail: 'b@x.com' }, 'user-1', 'a@x.com', 'office_manager')).toBe(true);
  });

  it('hr can never edit a placement it does not own — read-only, no bypass', () => {
    expect(canEditPlacement({ ownerId: 'user-2', ownerEmail: 'b@x.com' }, 'user-1', 'a@x.com', 'hr')).toBe(false);
    expect(canEditPlacement({ ownerId: null, ownerEmail: 'b@x.com' }, 'user-1', 'a@x.com', 'hr')).toBe(false);
  });
});

describe('canManageAllPlacements', () => {
  it('admin/manager/office_manager get full operational write scope', () => {
    expect(canManageAllPlacements('admin')).toBe(true);
    expect(canManageAllPlacements('manager')).toBe(true);
    expect(canManageAllPlacements('office_manager')).toBe(true);
  });

  it('hr and a plain member never get it', () => {
    expect(canManageAllPlacements('hr')).toBe(false);
    expect(canManageAllPlacements('member')).toBe(false);
  });
});

describe('canViewTeamOverview', () => {
  it('admin/manager/office_manager/hr can all view Friday Review', () => {
    expect(canViewTeamOverview('admin')).toBe(true);
    expect(canViewTeamOverview('manager')).toBe(true);
    expect(canViewTeamOverview('office_manager')).toBe(true);
    expect(canViewTeamOverview('hr')).toBe(true);
  });

  it('a plain member does not — matches the existing team-view design', () => {
    expect(canViewTeamOverview('member')).toBe(false);
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

describe('canManageTalentManagerAssignments', () => {
  it('admin/manager/office_manager may manage Talent Manager assignments', () => {
    expect(canManageTalentManagerAssignments('admin')).toBe(true);
    expect(canManageTalentManagerAssignments('manager')).toBe(true);
    expect(canManageTalentManagerAssignments('office_manager')).toBe(true);
  });

  it('never a plain AM/TM (member) or hr', () => {
    expect(canManageTalentManagerAssignments('member')).toBe(false);
    expect(canManageTalentManagerAssignments('hr')).toBe(false);
  });
});
