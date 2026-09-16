import { describe, expect, it } from 'vitest';
import { buildAccountManagerSummaries, buildCrossIntelligence, buildTalentManagerSummaries, countOpportunities, talentManagerTeamCompletion, teamCompletion } from './missionHuntAggregate';
import type { MissionHuntPlacement, MissionHuntProfile, PlacementReview, TalentManagerLink, TalentManagerReview, TeamMember } from '../types/missionHunt';

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

function tmLink(overrides: Partial<TalentManagerLink> = {}): TalentManagerLink {
  return { id: `l-${Math.random()}`, projectId: 'pl-1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x', ...overrides };
}

describe('buildTalentManagerSummaries — the exact multi-AM counting example from the spec', () => {
  // P1: AM Bernard, TM Kim. P2: AM Jurgen, TM Kim + TM Monique.
  const p1 = placement({ id: 'p1', ownerEmail: 'bernard.drost@maandag.com', ownerDisplayName: 'Bernard' });
  const p2 = placement({ id: 'p2', ownerEmail: 'jurgen.vandijk@maandag.com', ownerDisplayName: 'Jurgen' });
  const placements = [p1, p2];
  const links = [
    tmLink({ id: 'l1', projectId: 'p1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerDisplayName: 'Kim' }),
    tmLink({ id: 'l2', projectId: 'p2', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerDisplayName: 'Kim' }),
    tmLink({ id: 'l3', projectId: 'p2', talentManagerEmail: 'monique.schulten@maandag.com', talentManagerDisplayName: 'Monique' }),
  ];

  it('team total stays the UNIQUE placement count — never inflated by TM links', () => {
    expect(countOpportunities(placements).total).toBe(2);
  });

  it('Kim is linked to both AM portfolios: 2 unique placements, 2 accountmanagers', () => {
    const [kim] = buildTalentManagerSummaries(placements, links, [], []).filter((s) => s.emailNormalized === 'kim.schuring@maandag.com');
    expect(kim.counts.total).toBe(2);
    expect(kim.accountManagers).toHaveLength(2);
    expect(kim.accountManagers.map((g) => g.emailNormalized).sort()).toEqual(['bernard.drost@maandag.com', 'jurgen.vandijk@maandag.com']);
  });

  it('Monique is linked to only P2: 1 placement, 1 accountmanager', () => {
    const [monique] = buildTalentManagerSummaries(placements, links, [], []).filter((s) => s.emailNormalized === 'monique.schulten@maandag.com');
    expect(monique.counts.total).toBe(1);
    expect(monique.accountManagers).toHaveLength(1);
    expect(monique.accountManagers[0].emailNormalized).toBe('jurgen.vandijk@maandag.com');
  });

  it('a placement linked to 1 AM + 2 TMs still counts once per TM, never as 3 team placements', () => {
    const summaries = buildTalentManagerSummaries(placements, links, [], []);
    const totalAcrossTms = summaries.reduce((sum, s) => sum + s.counts.total, 0);
    // Kim(2) + Monique(1) = 3 TM-relations, while the team itself still has 2 unique placements.
    expect(totalAcrossTms).toBe(3);
    expect(countOpportunities(placements).total).toBe(2);
  });

  it('marks isVerified from talent_manager_reviews, independent of placement_reviews', () => {
    const reviews: TalentManagerReview[] = [{ id: 'r-1', userId: 'u-kim', userEmail: 'kim.schuring@maandag.com', verifiedAt: 'x', placementCountAtVerification: 2, createdAt: 'x' }];
    const summaries = buildTalentManagerSummaries(placements, links, [], reviews);
    expect(summaries.find((s) => s.emailNormalized === 'kim.schuring@maandag.com')!.isVerified).toBe(true);
    expect(summaries.find((s) => s.emailNormalized === 'monique.schulten@maandag.com')!.isVerified).toBe(false);
  });

  it('talentManagerTeamCompletion counts verified TMs the same way teamCompletion does for AMs', () => {
    const reviews: TalentManagerReview[] = [{ id: 'r-1', userId: 'u-kim', userEmail: 'kim.schuring@maandag.com', verifiedAt: 'x', placementCountAtVerification: 2, createdAt: 'x' }];
    const summaries = buildTalentManagerSummaries(placements, links, [], reviews);
    expect(talentManagerTeamCompletion(summaries)).toEqual({ verifiedCount: 1, totalCount: 2 });
  });
});

describe('buildCrossIntelligence', () => {
  it('produces one entry per AM x TM pair sharing at least one real placement, with no duplicate scoring', () => {
    const p1 = placement({ id: 'p1', ownerEmail: 'bernard.drost@maandag.com', ownerDisplayName: 'Bernard' });
    const p2 = placement({ id: 'p2', ownerEmail: 'bernard.drost@maandag.com', ownerDisplayName: 'Bernard' });
    const p3 = placement({ id: 'p3', ownerEmail: 'jurgen.vandijk@maandag.com', ownerDisplayName: 'Jurgen' });
    const links = [
      tmLink({ id: 'l1', projectId: 'p1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerDisplayName: 'Kim' }),
      tmLink({ id: 'l2', projectId: 'p2', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerDisplayName: 'Kim' }),
      tmLink({ id: 'l3', projectId: 'p3', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerDisplayName: 'Kim' }),
    ];
    const entries = buildCrossIntelligence([p1, p2, p3], links, []);
    expect(entries).toHaveLength(2);
    const bernardKim = entries.find((e) => e.accountManagerEmail === 'bernard.drost@maandag.com')!;
    expect(bernardKim.placements).toHaveLength(2);
    const jurgenKim = entries.find((e) => e.accountManagerEmail === 'jurgen.vandijk@maandag.com')!;
    expect(jurgenKim.placements).toHaveLength(1);
  });

  it('returns nothing when there are no TM links at all', () => {
    expect(buildCrossIntelligence([placement()], [], [])).toEqual([]);
  });
});
