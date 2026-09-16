import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FridayReviewView } from './FridayReviewView';
import type { MissionHuntPlacement, PlacementReview, TalentManagerLink, TalentManagerReview } from '../../types/missionHunt';

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

function renderView(props: Partial<ComponentProps<typeof FridayReviewView>> = {}) {
  return render(
    <FridayReviewView
      placements={[]}
      profiles={[]}
      teamMembers={[]}
      placementReviews={[]}
      talentManagerLinks={[]}
      talentManagerReviews={[]}
      onOpenPlacement={vi.fn()}
      {...props}
    />,
  );
}

describe('FridayReviewView', () => {
  it('shows TEAM ZWOLLE totals and separate AM CHECK / TM CHECK ratios', () => {
    const placements = [placement(), placement({ ownerEmail: 'lisa@maandag.com', ownerDisplayName: 'Lisa', startDate: '2026-06-01', endDate: '2026-12-31' })];
    const reviews: PlacementReview[] = [{ id: 'r-1', userId: 'u-1', userEmail: 'bernard.drost@maandag.com', verifiedAt: 'x', placementCountAtVerification: 1, createdAt: 'x' }];

    renderView({ placements, placementReviews: reviews });

    expect(screen.getByText(/am check/i)).toHaveTextContent('AM CHECK: 1 / 2 ACCOUNTMANAGERS GECONTROLEERD');
    expect(screen.getByText(/tm check/i)).toHaveTextContent('TM CHECK: 0 / 0 TALENT MANAGERS GECONTROLEERD');
  });

  it('never shows a professional/client name at the top level — only after clicking a person\'s card', () => {
    renderView({ placements: [placement()] });
    expect(screen.queryByText('Ryan Dijkstra')).not.toBeInTheDocument();
    expect(screen.getByText('Bernard')).toBeInTheDocument();
  });

  it('clicking an accountmanager\'s card opens their drilldown showing their actual placements', async () => {
    const user = userEvent.setup();
    renderView({ placements: [placement()] });

    await user.click(screen.getByText('Bernard'));
    expect(screen.getByText('Ryan Dijkstra')).toBeInTheDocument();
  });

  it('marks a person GECONTROLEERD or NOG CONTROLEREN based on their placement_review', () => {
    const placements = [placement(), placement({ ownerEmail: 'lisa@maandag.com', ownerDisplayName: 'Lisa' })];
    const reviews: PlacementReview[] = [{ id: 'r-1', userId: 'u-1', userEmail: 'bernard.drost@maandag.com', verifiedAt: 'x', placementCountAtVerification: 1, createdAt: 'x' }];
    renderView({ placements, placementReviews: reviews });

    expect(screen.getByText('✅ GECONTROLEERD')).toBeInTheDocument();
    expect(screen.getByText('⚠ NOG CONTROLEREN')).toBeInTheDocument();
  });

  it('shows Accountmanagers and Talent Managers as two clearly separate sections, never mixed', () => {
    const placements = [placement({ id: 'p1' })];
    const links: TalentManagerLink[] = [{ id: 'l1', projectId: 'p1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' }];
    renderView({ placements, talentManagerLinks: links });

    expect(screen.getByText('Accountmanagers')).toBeInTheDocument();
    expect(screen.getByText('Talent Managers')).toBeInTheDocument();
    expect(screen.getByText('Kim')).toBeInTheDocument();
  });

  it('team totals stay the unique placement count even when a placement has multiple TM links', () => {
    const placements = [placement({ id: 'p1' })];
    const links: TalentManagerLink[] = [
      { id: 'l1', projectId: 'p1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' },
      { id: 'l2', projectId: 'p1', talentManagerEmail: 'monique.schulten@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Monique', createdAt: 'x' },
    ];
    renderView({ placements, talentManagerLinks: links });

    const plaatsingenLabel = screen.getByText('Plaatsingen');
    expect(plaatsingenLabel.previousElementSibling).toHaveTextContent('1');
  });

  it('clicking a Talent Manager\'s card opens their drilldown grouped by accountmanager', async () => {
    const user = userEvent.setup();
    const placements = [placement({ id: 'p1', ownerEmail: 'bernard.drost@maandag.com', ownerDisplayName: 'Bernard' })];
    const links: TalentManagerLink[] = [{ id: 'l1', projectId: 'p1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' }];
    renderView({ placements, talentManagerLinks: links });

    await user.click(screen.getByText('Kim'));
    expect(screen.getByText('Ryan Dijkstra')).toBeInTheDocument();
    expect(screen.getByText(/Bernard — 1/)).toBeInTheDocument();
  });

  it('shows a Cross Intelligence entry for an AM x TM pair sharing a placement', () => {
    const placements = [placement({ id: 'p1', ownerEmail: 'bernard.drost@maandag.com', ownerDisplayName: 'Bernard' })];
    const links: TalentManagerLink[] = [{ id: 'l1', projectId: 'p1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' }];
    renderView({ placements, talentManagerLinks: links });

    expect(screen.getByText('Cross Intelligence')).toBeInTheDocument();
    expect(screen.getByText(/Bernard × Kim/)).toBeInTheDocument();
  });

  it('marks a Talent Manager GECONTROLEERD from talent_manager_reviews, independent of AM reviews', () => {
    const placements = [placement({ id: 'p1' })];
    const links: TalentManagerLink[] = [{ id: 'l1', projectId: 'p1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' }];
    const tmReviews: TalentManagerReview[] = [{ id: 'r-1', userId: 'u-kim', userEmail: 'kim.schuring@maandag.com', verifiedAt: 'x', placementCountAtVerification: 1, createdAt: 'x' }];
    renderView({ placements, talentManagerLinks: links, talentManagerReviews: tmReviews });

    expect(screen.getByText(/tm check/i)).toHaveTextContent('TM CHECK: 1 / 1 TALENT MANAGERS GECONTROLEERD');
  });
});
