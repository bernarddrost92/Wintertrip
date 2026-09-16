import { describe, expect, it } from 'vitest';
import { buildAccountManagerSummaries, countOpportunities, teamCompletion } from './missionHuntAggregate';
import type { MissionHuntPlacement, MissionHuntProfile, PlacementReview, TeamMember } from '../types/missionHunt';

function placement(overrides: Partial<MissionHuntPlacement> = {}): MissionHuntPlacement {
  return {
    id: `pl-${Math.random()}`,
    ownerId: null,
    ownerEmail: 'lisa@maandag.com',
    ownerDisplayName: 'Lisa',
    professionalName: 'Ryan Dijkstra',
    clientName: 'Greijdanus',
    startDate: '2026-06-01',
    endDate: '2028-06-30', // grey by default (outside both windows)
    hoursPerWeek: 24,
    monthlyDb: 10,
    note: null,
    fingerprint: 'fp',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

function profile(overrides: Partial<MissionHuntProfile> = {}): MissionHuntProfile {
  return {
    id: 'p-1',
    userId: 'user-1',
    displayName: 'Bernard',
    emailNormalized: 'bernard.drost@maandag.com',
    role: 'admin',
    active: true,
    createdAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('countOpportunities', () => {
  it('counts double placements in both verleng and timing, plus their own double bucket', () => {
    const placements = [
      placement({ startDate: '2026-10-01', endDate: '2026-12-31' }), // double
      placement({ startDate: '2026-06-01', endDate: '2026-12-31' }), // verleng only
      placement({ startDate: '2026-10-01', endDate: '2028-06-30' }), // timing only
      placement({ startDate: '2026-06-01', endDate: '2028-06-30' }), // grey
    ];
    const counts = countOpportunities(placements);
    expect(counts).toEqual({ total: 4, verleng: 2, timing: 2, double: 1, grey: 1 });
  });

  it('is all-zero for an empty list except total', () => {
    expect(countOpportunities([])).toEqual({ total: 0, verleng: 0, timing: 0, double: 0, grey: 0 });
  });
});

describe('buildAccountManagerSummaries', () => {
  it('groups placements by normalized owner email, independent of ownerId being set', () => {
    const placements = [
      placement({ ownerId: 'user-1', ownerEmail: 'bernard.drost@maandag.com', ownerDisplayName: 'Bernard' }),
      placement({ ownerId: null, ownerEmail: 'Bernard.Drost@Maandag.com', ownerDisplayName: 'Bernard' }),
      placement({ ownerId: null, ownerEmail: 'lisa@maandag.com', ownerDisplayName: 'Lisa' }),
    ];
    const summaries = buildAccountManagerSummaries(placements, [], [], []);
    expect(summaries).toHaveLength(2);
    const bernard = summaries.find((s) => s.emailNormalized === 'bernard.drost@maandag.com')!;
    expect(bernard.placements).toHaveLength(2);
  });

  it('prefers a logged-in profile\'s display name over the placement-captured one, and flags hasLoggedIn', () => {
    const placements = [placement({ ownerEmail: 'bernard.drost@maandag.com', ownerDisplayName: 'B. Drost (import)' })];
    const profiles = [profile({ displayName: 'Bernard', emailNormalized: 'bernard.drost@maandag.com' })];
    const [summary] = buildAccountManagerSummaries(placements, profiles, [], []);
    expect(summary.displayName).toBe('Bernard');
    expect(summary.hasLoggedIn).toBe(true);
  });

  it('falls back to the placement-captured display name when nobody has logged in yet', () => {
    const placements = [placement({ ownerEmail: 'lisa@maandag.com', ownerDisplayName: 'Lisa' })];
    const [summary] = buildAccountManagerSummaries(placements, [], [], []);
    expect(summary.displayName).toBe('Lisa');
    expect(summary.hasLoggedIn).toBe(false);
  });

  it('includes an active team_member with zero placements (roster readiness)', () => {
    const teamMembers: TeamMember[] = [{ id: 't-1', displayName: 'Marco', emailNormalized: 'marco@maandag.com', active: true, createdAt: '2026-09-01T00:00:00Z' }];
    const summaries = buildAccountManagerSummaries([], [], teamMembers, []);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].displayName).toBe('Marco');
    expect(summaries[0].placements).toHaveLength(0);
  });

  it('marks isVerified true only when a placement_review exists for that normalized email', () => {
    const placements = [placement({ ownerEmail: 'bernard.drost@maandag.com' }), placement({ ownerEmail: 'lisa@maandag.com' })];
    const reviews: PlacementReview[] = [
      { id: 'r-1', userId: 'user-1', userEmail: 'Bernard.Drost@Maandag.com', verifiedAt: '2026-09-16T13:42:00Z', placementCountAtVerification: 1, createdAt: '2026-09-16T13:42:00Z' },
    ];
    const summaries = buildAccountManagerSummaries(placements, [], [], reviews);
    const bernard = summaries.find((s) => s.emailNormalized === 'bernard.drost@maandag.com')!;
    const lisa = summaries.find((s) => s.emailNormalized === 'lisa@maandag.com')!;
    expect(bernard.isVerified).toBe(true);
    expect(lisa.isVerified).toBe(false);
  });
});

describe('teamCompletion', () => {
  it('counts how many of the tracked accountmanagers are verified', () => {
    const summaries = buildAccountManagerSummaries(
      [placement({ ownerEmail: 'bernard.drost@maandag.com' }), placement({ ownerEmail: 'lisa@maandag.com' }), placement({ ownerEmail: 'marco@maandag.com' })],
      [],
      [],
      [{ id: 'r-1', userId: 'u-1', userEmail: 'bernard.drost@maandag.com', verifiedAt: 'x', placementCountAtVerification: 1, createdAt: 'x' }],
    );
    expect(teamCompletion(summaries)).toEqual({ verifiedCount: 1, totalCount: 3 });
  });
});
