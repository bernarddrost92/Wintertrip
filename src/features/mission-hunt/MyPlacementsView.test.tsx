import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MyPlacementsView } from './MyPlacementsView';
import type { MissionHuntPlacement, OpportunityReview } from '../../types/missionHunt';

function placement(overrides: Partial<MissionHuntPlacement> = {}): MissionHuntPlacement {
  return {
    id: `pl-${Math.random()}`,
    ownerId: 'user-1',
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

/** "URENKANS" also labels the (always-rendered) PlacementFilterBar chip, so
 * every badge-presence assertion must exclude that button. */
function urenkansBadges() {
  return screen.getAllByText('URENKANS').filter((el) => el.tagName !== 'BUTTON');
}

function opportunityReview(overrides: Partial<OpportunityReview> = {}): OpportunityReview {
  return {
    id: `r-${Math.random()}`,
    projectId: 'pl-review-target',
    status: 'later',
    actionType: null,
    note: null,
    reviewerEmail: 'dave.holman@maandag.com',
    reviewerDisplayName: 'Dave',
    createdAt: '2026-09-18T09:00:00Z',
    updatedAt: '2026-09-18T09:00:00Z',
    ...overrides,
  };
}

describe('MyPlacementsView', () => {
  it('shows the VOOR VRIJDAG homework block and stat counts', () => {
    const placements = [placement(), placement({ startDate: '2026-06-01', endDate: '2028-06-30' })];
    render(<MyPlacementsView displayName="Bernard" placements={placements} isVerified={false} verifiedAt={null} onAdd={vi.fn()} onOpenPlacement={vi.fn()} onVerify={vi.fn()} />);

    expect(screen.getByText(/voor vrijdag/i)).toBeInTheDocument();
    expect(screen.getByText('Bernard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /alles klopt/i })).toBeInTheDocument();
  });

  it('shows the double opportunity placement with all three badges', () => {
    render(<MyPlacementsView displayName="Bernard" placements={[placement()]} isVerified={false} verifiedAt={null} onAdd={vi.fn()} onOpenPlacement={vi.fn()} onVerify={vi.fn()} />);
    expect(screen.getByText('TIMINGKANS')).toBeInTheDocument();
    expect(screen.getByText('VERLENGKANS')).toBeInTheDocument();
    expect(screen.getByText('DOUBLE OPPORTUNITY')).toBeInTheDocument();
  });

  it('shows GECONTROLEERD with a timestamp instead of the ALLES KLOPT button once verified', () => {
    render(
      <MyPlacementsView
        displayName="Bernard"
        placements={[placement()]}
        isVerified
        verifiedAt="2026-09-16T13:42:00Z"
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
      />,
    );
    expect(screen.getByText(/gecontroleerd/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /alles klopt/i })).not.toBeInTheDocument();
  });

  it('clicking ALLES KLOPT calls onVerify', async () => {
    const onVerify = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<MyPlacementsView displayName="Bernard" placements={[placement()]} isVerified={false} verifiedAt={null} onAdd={vi.fn()} onOpenPlacement={vi.fn()} onVerify={onVerify} />);
    await user.click(screen.getByRole('button', { name: /alles klopt/i }));
    expect(onVerify).toHaveBeenCalledTimes(1);
  });

  it('the filter bar narrows the visible placements without touching the stat counts', async () => {
    const placements = [placement(), placement({ startDate: '2026-06-01', endDate: '2028-06-30', professionalName: 'Grey Persoon' })];
    const user = userEvent.setup();
    render(<MyPlacementsView displayName="Bernard" placements={placements} isVerified={false} verifiedAt={null} onAdd={vi.fn()} onOpenPlacement={vi.fn()} onVerify={vi.fn()} />);

    // Privacy hotfix: PlacementRow shows initials only, never the full name.
    expect(screen.getByText('R.D.')).toBeInTheDocument();
    expect(screen.getByText('G.P.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'DOUBLE' }));
    expect(screen.getByText('R.D.')).toBeInTheDocument();
    expect(screen.queryByText('G.P.')).not.toBeInTheDocument();
  });

  it('shows the URENKANSEN summary counter tile', () => {
    const placements = [placement({ hoursPerWeek: 0.4 }), placement({ hoursPerWeek: 1.0, startDate: '2026-06-01', endDate: '2028-06-30' })];
    render(<MyPlacementsView displayName="Bernard" placements={placements} isVerified={false} verifiedAt={null} onAdd={vi.fn()} onOpenPlacement={vi.fn()} onVerify={vi.fn()} />);

    const urenkansenLabel = screen.getByText('Urenkansen');
    expect(urenkansenLabel.previousElementSibling).toHaveTextContent('1');
  });

  it('shows the URENKANS badge and calculated weekly hours for a placement below 32 hours/week, alongside its other badges', () => {
    const placements = [placement({ hoursPerWeek: 0.4 })]; // also timing+extension (double) by default dates
    render(<MyPlacementsView displayName="Bernard" placements={placements} isVerified={false} verifiedAt={null} onAdd={vi.fn()} onOpenPlacement={vi.fn()} onVerify={vi.fn()} />);

    // "URENKANS" also labels the (always-rendered) filter chip, so scope to
    // the actual badge span, not the filter bar button.
    expect(urenkansBadges()).toHaveLength(1);
    expect(screen.getByText('0.4 FTE · 16 UUR')).toBeInTheDocument();
    // Additive — the double-opportunity badges from the dates are still there too.
    expect(screen.getByText('DOUBLE OPPORTUNITY')).toBeInTheDocument();
  });

  it('does not show a URENKANS badge for a placement at or above 0.8 FTE', () => {
    render(<MyPlacementsView displayName="Bernard" placements={[placement({ hoursPerWeek: 0.8 })]} isVerified={false} verifiedAt={null} onAdd={vi.fn()} onOpenPlacement={vi.fn()} onVerify={vi.fn()} />);
    expect(urenkansBadges()).toHaveLength(0);
  });

  it('opening the add form and filling required fields enables submit, and calls onAdd with owner never asked', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<MyPlacementsView displayName="Bernard" placements={[]} isVerified={false} verifiedAt={null} onAdd={onAdd} onOpenPlacement={vi.fn()} onVerify={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /plaatsing toevoegen/i }));
    await user.type(screen.getByLabelText(/professional/i), 'Nieuwe Professional');
    await user.type(screen.getByLabelText(/klant/i), 'Nieuwe Klant');
    await user.type(screen.getByLabelText(/startdatum/i), '2026-10-01');
    await user.type(screen.getByLabelText(/einddatum/i), '2026-12-31');
    await user.click(screen.getByRole('button', { name: /^plaatsing toevoegen$/i }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ professionalName: 'Nieuwe Professional', clientName: 'Nieuwe Klant', startDate: '2026-10-01', endDate: '2026-12-31' }),
    );
    // Never asks for accountmanager/email on the form itself.
    expect(screen.queryByLabelText(/e-mail/i)).not.toBeInTheDocument();
  });
});

describe('MyPlacementsView — opportunity review (sales-meeting workflow)', () => {
  it('an opportunity starts as unreviewed, showing NOG TE BEOORDELEN and a BEOORDELEN button', () => {
    const opportunity = placement({ id: 'pl-1' }); // default dates = DOUBLE OPPORTUNITY
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={[opportunity]}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
        opportunityReviews={[]}
        onReviewOpportunity={vi.fn()}
      />,
    );

    // "Nog te beoordelen" (mixed-case, from the review control) vs the
    // filter chip's exact uppercase "NOG TE BEOORDELEN" — assert the exact
    // string so this never collides with the chip.
    expect(screen.getByText('Nog te beoordelen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beoordelen' })).toBeInTheDocument();
  });

  it('GEEN KANS saves immediately with no action type/note', async () => {
    const user = userEvent.setup();
    const onReviewOpportunity = vi.fn().mockResolvedValue(undefined);
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={[placement({ id: 'pl-1' })]}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
        opportunityReviews={[]}
        onReviewOpportunity={onReviewOpportunity}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Beoordelen' }));
    // Exact match: the filter chip is plain "GEEN KANS", the choosing-mode
    // button is "✓ Geen Kans" — different strings, no collision.
    await user.click(screen.getByRole('button', { name: '✓ Geen Kans' }));

    expect(onReviewOpportunity).toHaveBeenCalledWith('pl-1', 'geen_kans', null, null);
  });

  it('LATER saves immediately and counts as reviewed', async () => {
    const user = userEvent.setup();
    const onReviewOpportunity = vi.fn().mockResolvedValue(undefined);
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={[placement({ id: 'pl-1' })]}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
        opportunityReviews={[]}
        onReviewOpportunity={onReviewOpportunity}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Beoordelen' }));
    await user.click(screen.getByRole('button', { name: '→ Later' }));

    expect(onReviewOpportunity).toHaveBeenCalledWith('pl-1', 'later', null, null);
  });

  it('OPVOLGEN opens a small form and saves the chosen action type + optional note', async () => {
    const user = userEvent.setup();
    const onReviewOpportunity = vi.fn().mockResolvedValue(undefined);
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={[placement({ id: 'pl-1' })]}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
        opportunityReviews={[]}
        onReviewOpportunity={onReviewOpportunity}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Beoordelen' }));
    await user.click(screen.getByRole('button', { name: '🎯 Opvolgen' }));
    await user.click(screen.getByRole('button', { name: 'VERLENGING BESPREKEN' }));
    await user.type(screen.getByLabelText(/korte notitie/i), 'Directeur volgende week bellen.');
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));

    expect(onReviewOpportunity).toHaveBeenCalledWith('pl-1', 'opvolgen', 'verlenging_bespreken', 'Directeur volgende week bellen.');
  });

  it('OPVOLGEN without a note saves with note=null (optional, never required)', async () => {
    const user = userEvent.setup();
    const onReviewOpportunity = vi.fn().mockResolvedValue(undefined);
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={[placement({ id: 'pl-1' })]}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
        opportunityReviews={[]}
        onReviewOpportunity={onReviewOpportunity}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Beoordelen' }));
    await user.click(screen.getByRole('button', { name: '🎯 Opvolgen' }));
    await user.click(screen.getByRole('button', { name: 'UREN OPHOGEN' }));
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));

    expect(onReviewOpportunity).toHaveBeenCalledWith('pl-1', 'opvolgen', 'uren_ophogen', null);
  });

  it('a reviewed placement shows ✓ BEOORDEELD, its status, and a checkmark on the opportunity badge, while the badge label stays visible', () => {
    const review = opportunityReview({ projectId: 'pl-1', status: 'opvolgen', actionType: 'verlenging_bespreken', note: 'Bellen volgende week' });
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={[placement({ id: 'pl-1' })]}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
        opportunityReviews={[review]}
        onReviewOpportunity={vi.fn()}
      />,
    );

    // Exact match — "Beoordeeld 1 / 1" (the progress tile's label) is a
    // different string and must not collide with this.
    expect(screen.getByText('✓ Beoordeeld')).toBeInTheDocument();
    expect(screen.getByText('VERLENGING BESPREKEN')).toBeInTheDocument();
    expect(screen.getByText('"Bellen volgende week"')).toBeInTheDocument();
    // DOUBLE OPPORTUNITY (and every other badge on this placement) is still
    // labeled — additive, never replaced — just with a ✓ icon instead of 🔥.
    expect(screen.getByText('DOUBLE OPPORTUNITY')).toBeInTheDocument();
  });

  it('the personal progress counter reflects reviewed/opvolgen/geen kans/later, with the denominator excluding GEEN DIRECTE GAME-KANS-only placements', () => {
    const placements = [
      placement({ id: 'p1' }), // opportunity (double), reviewed opvolgen below
      placement({ id: 'p2', endDate: '2026-11-15' }), // opportunity (verleng), reviewed geen_kans below
      placement({ id: 'p3', startDate: '2026-06-01', endDate: '2026-08-31', hoursPerWeek: 24 }), // no signal — never counted
    ];
    const reviews = [opportunityReview({ projectId: 'p1', status: 'opvolgen' }), opportunityReview({ projectId: 'p2', status: 'geen_kans' })];
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={placements}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
        opportunityReviews={reviews}
        onReviewOpportunity={vi.fn()}
      />,
    );

    const beoordeeldLabel = screen.getByText('Beoordeeld 2 / 2');
    expect(beoordeeldLabel.previousElementSibling).toHaveTextContent('2');
  });

  it('Mission Complete unlocks once every opportunity is reviewed (LATER accepted) and the receipt shows commitments', async () => {
    const user = userEvent.setup();
    const placements = [placement({ id: 'p1', professionalName: 'Ryan Dijkstra', clientName: 'Greijdanus' }), placement({ id: 'p2', endDate: '2026-11-15' })];
    const reviews = [
      opportunityReview({ projectId: 'p1', status: 'opvolgen', actionType: 'timing_inschieten', note: 'Contract deze week rond.' }),
      opportunityReview({ projectId: 'p2', status: 'later' }),
    ];
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={placements}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
        opportunityReviews={reviews}
        onReviewOpportunity={vi.fn()}
      />,
    );

    const missionCompleteButton = screen.getByRole('button', { name: /mission complete/i });
    expect(missionCompleteButton).toBeInTheDocument();
    await user.click(missionCompleteButton);

    // Privacy hotfix: the receipt shows initials + city, never the real name.
    expect(screen.getByText('Mission Hunt Receipt')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('R.D.') && content.includes('LOCATIE ONBEKEND'))).toBeInTheDocument();
    expect(screen.queryByText(/Ryan Dijkstra/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Greijdanus/)).not.toBeInTheDocument();
    // Also still shown on the reviewed placement row itself below the
    // receipt (additive, never replaced) — hence AllBy, not a single match.
    expect(screen.getAllByText('TIMING / INSCHIETEN').length).toBeGreaterThan(0);
    expect(screen.getByText('1 acties')).toBeInTheDocument();
  });

  it('does not offer Mission Complete while opportunities remain unreviewed', () => {
    const placements = [placement({ id: 'p1' }), placement({ id: 'p2', endDate: '2026-11-15' })];
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={placements}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
        opportunityReviews={[opportunityReview({ projectId: 'p1', status: 'later' })]}
        onReviewOpportunity={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /mission complete/i })).not.toBeInTheDocument();
  });

  it('the review filter chips narrow the list to NOG TE BEOORDELEN / OPVOLGEN / GEEN KANS / LATER without touching the opportunity-type filters', async () => {
    const user = userEvent.setup();
    const placements = [
      placement({ id: 'p1', professionalName: 'Reviewed Opvolgen' }),
      placement({ id: 'p2', endDate: '2026-11-15', professionalName: 'Still Unreviewed' }),
    ];
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={placements}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
        opportunityReviews={[opportunityReview({ projectId: 'p1', status: 'opvolgen' })]}
        onReviewOpportunity={vi.fn()}
      />,
    );

    // Privacy hotfix: PlacementRow shows initials only ("R.O.", "S.U.").
    expect(screen.getByText('R.O.')).toBeInTheDocument();
    expect(screen.getByText('S.U.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'NOG TE BEOORDELEN' }));
    expect(screen.queryByText('R.O.')).not.toBeInTheDocument();
    expect(screen.getByText('S.U.')).toBeInTheDocument();
  });

  it('omitting onReviewOpportunity hides the entire review workflow — the view behaves exactly as before', () => {
    render(
      <MyPlacementsView
        displayName="Dave"
        placements={[placement({ id: 'p1' })]}
        isVerified={false}
        verifiedAt={null}
        onAdd={vi.fn()}
        onOpenPlacement={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.queryByText(/nog te beoordelen/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^beoordelen$/i })).not.toBeInTheDocument();
  });
});
