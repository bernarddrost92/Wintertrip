import { describe, expect, it } from 'vitest';
import { newProjectToInsertRow, profileRowToProfile, projectRowToProject } from './missionHuntMapping';

describe('profileRowToProfile', () => {
  it('maps snake_case columns to the camelCase app shape', () => {
    const profile = profileRowToProfile({
      id: 'p-1',
      user_id: 'u-1',
      display_name: 'Bernard',
      role: 'admin',
      active: true,
      created_at: '2026-09-01T00:00:00Z',
    });
    expect(profile).toEqual({ id: 'p-1', userId: 'u-1', displayName: 'Bernard', role: 'admin', active: true, createdAt: '2026-09-01T00:00:00Z' });
  });
});

describe('projectRowToProject', () => {
  it('maps snake_case columns to the camelCase app shape, defaulting a null opportunity_types to []', () => {
    const project = projectRowToProject({
      id: 'proj-1',
      owner_id: 'u-1',
      project_name: 'De Meerwaarde',
      client_name: 'Han',
      professional_name: null,
      start_date: null,
      end_date: null,
      hours_per_week: null,
      monthly_vcdb: null,
      note: null,
      status: 'unreviewed',
      opportunity_types: null,
      fingerprint: 'fp',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    });
    expect(project.opportunityTypes).toEqual([]);
    expect(project.projectName).toBe('De Meerwaarde');
    expect(project.ownerId).toBe('u-1');
  });
});

describe('newProjectToInsertRow', () => {
  it('always starts a new project at status unreviewed with no opportunity types', () => {
    const row = newProjectToInsertRow('u-1', { projectName: 'X', clientName: 'Y' }, 'fp-123');
    expect(row.status).toBe('unreviewed');
    expect(row.opportunity_types).toEqual([]);
    expect(row.owner_id).toBe('u-1');
    expect(row.fingerprint).toBe('fp-123');
  });
});
