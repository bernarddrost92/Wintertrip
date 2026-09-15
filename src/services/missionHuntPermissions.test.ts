import { describe, expect, it } from 'vitest';
import { canEditProject } from './missionHuntPermissions';

describe('canEditProject', () => {
  it('a member can edit their own project', () => {
    expect(canEditProject({ ownerId: 'user-1' }, 'user-1', 'member')).toBe(true);
  });

  it('a member cannot edit a colleague\'s project', () => {
    expect(canEditProject({ ownerId: 'user-2' }, 'user-1', 'member')).toBe(false);
  });

  it('an admin can edit any project, including their own', () => {
    expect(canEditProject({ ownerId: 'user-2' }, 'user-1', 'admin')).toBe(true);
    expect(canEditProject({ ownerId: 'user-1' }, 'user-1', 'admin')).toBe(true);
  });
});
