import { describe, expect, it } from 'vitest';
import { buildOpportunityReviewProgress, hasOpportunitySignal } from './missionHuntOpportunityReview';
import { classifyPlacement } from './missionHuntClassification';
import type { MissionHuntPlacement, OpportunityReview } from '../types/missionHunt';

function placement(overrides: Partial<MissionHuntPlacement> = {}): MissionHuntPlacement {
  return {
    id: `pl-${Math.random()}`,
    ownerId: 'user-1',
    ownerEmail: 'dave.holman@maandag.com',
    ownerDisplayName: 'Dave',
    professionalName: 'Ryan Dijkstra',
    clientName: 'Greijdanus',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    hoursPerWeek: 1,
    monthlyDb: 10,
    note: null,
    fingerprint: 'fp',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

function review(projectId: string, status: OpportunityReview['status'], overrides: Partial<OpportunityReview> = {}): OpportunityReview {
  return {
    id: `r-${Math.random()}`,
    projectId,
    status,
    actionType: null,
    note: null,
    reviewerEmail: 'dave.holman@maandag.com',
    reviewerDisplayName: 'Dave',
    createdAt: '2026-09-18T09:00:00Z',
    updatedAt: '2026-09-18T09:00:00Z',
    ...overrides,
  };
}

describe('hasOpportunitySignal', () => {
  it('is false for a placement with no timing/extension/urenkans signal (GEEN DIRECTE GAME-KANS only)', () => {
    const classification = classifyPlacement('2026-06-01', '2026-08-31', 1); // not timing, not extension (ends before league period), not urenkans
    expect(classification.isGrey).toBe(true);
    expect(hasOpportunitySignal(classification)).toBe(false);
  });

  it('is true for VERLENGKANS alone', () => {
    const classification = classifyPlacement('2026-06-01', '2026-10-15', 1);
    expect(hasOpportunitySignal(classification)).toBe(true);
  });

  it('is true for URENKANS alone, even when otherwise grey', () => {
    const classification = classifyPlacement('2026-06-01', '2026-08-31', 0.5);
    expect(classification.isGrey).toBe(true);
    expect(classification.isUrenkans).toBe(true);
    expect(hasOpportunitySignal(classification)).toBe(true);
  });

  it('is true for DOUBLE OPPORTUNITY', () => {
    const classification = classifyPlacement('2026-10-01', '2026-12-31', 1);
    expect(hasOpportunitySignal(classification)).toBe(true);
  });
});

describe('buildOpportunityReviewProgress', () => {
  it('denominator only counts placements with a detected opportunity, never GEEN DIRECTE GAME-KANS-only ones', () => {
    const opportunity = placement({ id: 'p1', endDate: '2026-10-15' }); // verlengkans
    const grey = placement({ id: 'p2', startDate: '2026-06-01', endDate: '2026-08-31', hoursPerWeek: 1 }); // no signal
    const progress = buildOpportunityReviewProgress([opportunity, grey], []);
    expect(progress.opportunityTotal).toBe(1);
  });

  it('starts fully unreviewed with zero counts and Mission Complete false', () => {
    const opportunity = placement({ id: 'p1', endDate: '2026-10-15' });
    const progress = buildOpportunityReviewProgress([opportunity], []);
    expect(progress).toEqual({ opportunityTotal: 1, reviewedCount: 0, opvolgen: 0, geenKans: 0, later: 0, missionComplete: false });
  });

  it('counts OPVOLGEN/GEEN KANS/LATER independently and sums to reviewedCount', () => {
    const placements = [
      placement({ id: 'p1', endDate: '2026-10-15' }),
      placement({ id: 'p2', endDate: '2026-11-15' }),
      placement({ id: 'p3', endDate: '2026-12-15' }),
    ];
    const reviews = [review('p1', 'opvolgen'), review('p2', 'geen_kans'), review('p3', 'later')];
    const progress = buildOpportunityReviewProgress(placements, reviews);
    expect(progress).toEqual({ opportunityTotal: 3, reviewedCount: 3, opvolgen: 1, geenKans: 1, later: 1, missionComplete: true });
  });

  it('Mission Complete unlocks with LATER accepted as reviewed, never blocked by it', () => {
    const placements = [placement({ id: 'p1', endDate: '2026-10-15' }), placement({ id: 'p2', endDate: '2026-11-15' })];
    const reviews = [review('p1', 'later'), review('p2', 'later')];
    const progress = buildOpportunityReviewProgress(placements, reviews);
    expect(progress.missionComplete).toBe(true);
  });

  it('Mission Complete stays false with zero opportunities (never a vacuous complete)', () => {
    const grey = placement({ id: 'p1', startDate: '2026-06-01', endDate: '2026-08-31', hoursPerWeek: 1 });
    const progress = buildOpportunityReviewProgress([grey], []);
    expect(progress.opportunityTotal).toBe(0);
    expect(progress.missionComplete).toBe(false);
  });

  it('ignores review rows for placements outside the given list', () => {
    const placements = [placement({ id: 'p1', endDate: '2026-10-15' })];
    const reviews = [review('p1', 'opvolgen'), review('someone-elses-placement', 'later')];
    const progress = buildOpportunityReviewProgress(placements, reviews);
    expect(progress.reviewedCount).toBe(1);
    expect(progress.opvolgen).toBe(1);
  });

  it('partial review leaves Mission Complete false', () => {
    const placements = [placement({ id: 'p1', endDate: '2026-10-15' }), placement({ id: 'p2', endDate: '2026-11-15' })];
    const reviews = [review('p1', 'opvolgen')];
    const progress = buildOpportunityReviewProgress(placements, reviews);
    expect(progress.reviewedCount).toBe(1);
    expect(progress.missionComplete).toBe(false);
  });
});
