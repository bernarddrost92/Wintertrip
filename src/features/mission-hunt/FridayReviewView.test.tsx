import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FridayReviewView } from './FridayReviewView';
import type { MissionHuntPlacement, PlacementReview } from '../../types/missionHunt';

function placement(overrides: Partial<MissionHuntPlacement> = {}): MissionHuntPlacement {
  return {
    id: `pl-${Math.random()}`,
    ownerId: null,
    ownerEmail: 'bernard.drost@maandag.com',
    ownerDisplayName: 'Bernard',
    professionalName: 'Ryan Dijkstra',
    clientName: 'Greijdanus',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    hoursPerWeek: 24,
    monthlyDb: 10,
    note: null,
    fingerprint: 'fp',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('FridayReviewView', () => {
  it('shows TEAM ZWOLLE totals and the team check ratio', () => {
    const placements = [placement(), placement({ ownerEmail: 'lisa@maandag.com', ownerDisplayName: 'Lisa', startDate: '2026-06-01', endDate: '2026-12-31' })];
    const reviews: PlacementReview[] = [{ id: 'r-1', userId: 'u-1', userEmail: 'bernard.drost@maandag.com', verifiedAt: 'x', placementCountAtVerification: 1, createdAt: 'x' }];

    render(<FridayReviewView placements={placements} profiles={[]} teamMembers={[]} placementReviews={reviews} onOpenPlacement={vi.fn()} />);

    expect(screen.getByText(/team check/i)).toHaveTextContent('TEAM CHECK: 1 / 2 ACCOUNTMANAGERS GECONTROLEERD');
  });

  it('never shows a professional/client name at the top level — only after clicking a person\'s card', () => {
    render(<FridayReviewView placements={[placement()]} profiles={[]} teamMembers={[]} placementReviews={[]} onOpenPlacement={vi.fn()} />);
    expect(screen.queryByText('Ryan Dijkstra')).not.toBeInTheDocument();
    expect(screen.getByText('Bernard')).toBeInTheDocument();
  });

  it('clicking a person\'s card opens their drilldown showing their actual placements', async () => {
    const user = userEvent.setup();
    render(<FridayReviewView placements={[placement()]} profiles={[]} teamMembers={[]} placementReviews={[]} onOpenPlacement={vi.fn()} />);

    await user.click(screen.getByText('Bernard'));
    expect(screen.getByText('Ryan Dijkstra')).toBeInTheDocument();
  });

  it('marks a person GECONTROLEERD or NOG CONTROLEREN based on their placement_review', () => {
    const placements = [placement(), placement({ ownerEmail: 'lisa@maandag.com', ownerDisplayName: 'Lisa' })];
    const reviews: PlacementReview[] = [{ id: 'r-1', userId: 'u-1', userEmail: 'bernard.drost@maandag.com', verifiedAt: 'x', placementCountAtVerification: 1, createdAt: 'x' }];
    render(<FridayReviewView placements={placements} profiles={[]} teamMembers={[]} placementReviews={reviews} onOpenPlacement={vi.fn()} />);

    expect(screen.getByText('✅ GECONTROLEERD')).toBeInTheDocument();
    expect(screen.getByText('⚠ NOG CONTROLEREN')).toBeInTheDocument();
  });
});
