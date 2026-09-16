import { describe, expect, it } from 'vitest';
import {
  newPlacementToInsertRow,
  placementRowToPlacement,
  placementReviewRowToPlacementReview,
  profileRowToProfile,
  talentManagerEmailsToInsertRows,
  talentManagerLinkRowToTalentManagerLink,
  talentManagerReviewRowToTalentManagerReview,
  teamImportRowToInsertRow,
  teamMemberRoleRowToTeamMemberRole,
  teamMemberRowToTeamMember,
} from './missionHuntMapping';

describe('profileRowToProfile', () => {
  it('maps snake_case columns to the camelCase app shape', () => {
    const profile = profileRowToProfile({
      id: 'p-1',
      user_id: 'u-1',
      display_name: 'Bernard',
      email_normalized: 'bernard.drost@maandag.com',
      role: 'admin',
      active: true,
      created_at: '2026-09-01T00:00:00Z',
    });
    expect(profile).toEqual({
      id: 'p-1',
      userId: 'u-1',
      displayName: 'Bernard',
      emailNormalized: 'bernard.drost@maandag.com',
      role: 'admin',
      active: true,
      createdAt: '2026-09-01T00:00:00Z',
    });
  });
});

describe('placementRowToPlacement', () => {
  it('maps snake_case columns to the camelCase app shape, including a null ownerId for an unclaimed row', () => {
    const placement = placementRowToPlacement({
      id: 'proj-1',
      owner_id: null,
      owner_email: 'lisa@maandag.com',
      owner_display_name: 'Lisa',
      professional_name: 'Ryan Dijkstra',
      client_name: 'Greijdanus',
      start_date: '2026-10-01',
      end_date: '2026-12-31',
      hours_per_week: 24,
      monthly_vcdb: 10,
      note: null,
      fingerprint: 'fp',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    });
    expect(placement.ownerId).toBeNull();
    expect(placement.ownerEmail).toBe('lisa@maandag.com');
    expect(placement.ownerDisplayName).toBe('Lisa');
    expect(placement.professionalName).toBe('Ryan Dijkstra');
    expect(placement.monthlyDb).toBe(10);
  });
});

describe('newPlacementToInsertRow', () => {
  it('normalizes the owner email and computes a matching fingerprint', () => {
    const row = newPlacementToInsertRow('u-1', 'Bernard.Drost@Maandag.com', 'Bernard', {
      professionalName: 'Ryan Dijkstra',
      clientName: 'Greijdanus',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
      hoursPerWeek: 24,
      monthlyDb: 10,
    });
    expect(row.owner_id).toBe('u-1');
    expect(row.owner_email).toBe('bernard.drost@maandag.com');
    expect(row.owner_display_name).toBe('Bernard');
    expect(row.fingerprint).toBe('bernard.drost@maandag.com::ryan dijkstra::greijdanus::2026-10-01::2026-12-31');
  });
});

describe('teamImportRowToInsertRow', () => {
  it('always writes owner_id null — the office manager import never claims ownership itself', () => {
    const row = teamImportRowToInsertRow(
      {
        ownerEmail: 'Lisa@Maandag.com',
        ownerDisplayName: 'Lisa',
        professionalName: 'Ryan Dijkstra',
        clientName: 'Greijdanus',
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        hoursPerWeek: 24,
        monthlyDb: 10,
        talentManagerEmails: [],
        talentManagerDisplayNames: [],
      },
      'lisa@maandag.com::ryan dijkstra::greijdanus::2026-10-01::2026-12-31',
    );
    expect(row.owner_id).toBeNull();
    expect(row.owner_email).toBe('lisa@maandag.com');
    expect(row.owner_display_name).toBe('Lisa');
  });
});

describe('talentManagerLinkRowToTalentManagerLink / talentManagerReviewRowToTalentManagerReview / teamMemberRoleRowToTeamMemberRole', () => {
  it('map their respective snake_case rows', () => {
    expect(
      talentManagerLinkRowToTalentManagerLink({
        id: 'l-1',
        project_id: 'proj-1',
        talent_manager_email: 'kim.schuring@maandag.com',
        talent_manager_id: null,
        talent_manager_display_name: 'Kim',
        created_at: '2026-09-16T00:00:00Z',
      }),
    ).toEqual({
      id: 'l-1',
      projectId: 'proj-1',
      talentManagerEmail: 'kim.schuring@maandag.com',
      talentManagerId: null,
      talentManagerDisplayName: 'Kim',
      createdAt: '2026-09-16T00:00:00Z',
    });

    expect(
      talentManagerReviewRowToTalentManagerReview({
        id: 'r-1',
        user_id: 'u-2',
        user_email: 'kim.schuring@maandag.com',
        verified_at: '2026-09-16T13:42:00Z',
        placement_count_at_verification: 6,
        created_at: '2026-09-16T13:42:00Z',
      }),
    ).toEqual({
      id: 'r-1',
      userId: 'u-2',
      userEmail: 'kim.schuring@maandag.com',
      verifiedAt: '2026-09-16T13:42:00Z',
      placementCountAtVerification: 6,
      createdAt: '2026-09-16T13:42:00Z',
    });

    expect(
      teamMemberRoleRowToTeamMemberRole({ id: 'role-1', email_normalized: 'kim.schuring@maandag.com', role: 'talent_manager', created_at: '2026-09-16T00:00:00Z' }),
    ).toEqual({ id: 'role-1', emailNormalized: 'kim.schuring@maandag.com', role: 'talent_manager', createdAt: '2026-09-16T00:00:00Z' });
  });
});

describe('talentManagerEmailsToInsertRows', () => {
  it('normalizes emails and pairs each with its display name by index', () => {
    const rows = talentManagerEmailsToInsertRows('proj-1', ['Kim.Schuring@Maandag.com', 'monique@maandag.com'], ['Kim', 'Monique']);
    expect(rows).toEqual([
      { project_id: 'proj-1', talent_manager_email: 'kim.schuring@maandag.com', talent_manager_display_name: 'Kim' },
      { project_id: 'proj-1', talent_manager_email: 'monique@maandag.com', talent_manager_display_name: 'Monique' },
    ]);
  });

  it('defaults a missing display name to null rather than throwing', () => {
    const rows = talentManagerEmailsToInsertRows('proj-1', ['kim@maandag.com'], []);
    expect(rows).toEqual([{ project_id: 'proj-1', talent_manager_email: 'kim@maandag.com', talent_manager_display_name: null }]);
  });
});

describe('teamMemberRowToTeamMember / placementReviewRowToPlacementReview', () => {
  it('map their respective snake_case rows', () => {
    expect(teamMemberRowToTeamMember({ id: 't-1', display_name: 'Lisa', email_normalized: 'lisa@maandag.com', active: true, created_at: '2026-09-01T00:00:00Z' })).toEqual({
      id: 't-1',
      displayName: 'Lisa',
      emailNormalized: 'lisa@maandag.com',
      active: true,
      createdAt: '2026-09-01T00:00:00Z',
    });

    expect(
      placementReviewRowToPlacementReview({
        id: 'r-1',
        user_id: 'u-1',
        user_email: 'bernard.drost@maandag.com',
        verified_at: '2026-09-16T13:42:00Z',
        placement_count_at_verification: 12,
        created_at: '2026-09-16T13:42:00Z',
      }),
    ).toEqual({
      id: 'r-1',
      userId: 'u-1',
      userEmail: 'bernard.drost@maandag.com',
      verifiedAt: '2026-09-16T13:42:00Z',
      placementCountAtVerification: 12,
      createdAt: '2026-09-16T13:42:00Z',
    });
  });
});
