import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MyPlacementsView } from './MyPlacementsView';
import type { MissionHuntPlacement } from '../../types/missionHunt';

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

    expect(screen.getByText('Ryan Dijkstra')).toBeInTheDocument();
    expect(screen.getByText('Grey Persoon')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'DOUBLE' }));
    expect(screen.getByText('Ryan Dijkstra')).toBeInTheDocument();
    expect(screen.queryByText('Grey Persoon')).not.toBeInTheDocument();
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
