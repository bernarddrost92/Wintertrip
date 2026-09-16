import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MyProfessionalsView } from './MyProfessionalsView';
import { buildTalentManagerSummaries } from '../../services/missionHuntAggregate';
import type { MissionHuntPlacement, TalentManagerLink } from '../../types/missionHunt';

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

describe('MyProfessionalsView', () => {
  it('shows MIJN PROFESSIONALS with total placements, AM count, and opportunity counts, grouped by accountmanager', () => {
    const p1 = placement({ id: 'p1', ownerEmail: 'bernard.drost@maandag.com', ownerDisplayName: 'Bernard' });
    const p2 = placement({ id: 'p2', ownerEmail: 'jurgen.vandijk@maandag.com', ownerDisplayName: 'Jurgen', professionalName: 'Andere Prof' });
    const links: TalentManagerLink[] = [
      { id: 'l1', projectId: 'p1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' },
      { id: 'l2', projectId: 'p2', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' },
    ];
    const [summary] = buildTalentManagerSummaries([p1, p2], links, [], []);

    render(<MyProfessionalsView displayName="Kim" summary={summary} isVerified={false} verifiedAt={null} onOpenPlacement={vi.fn()} onVerify={vi.fn()} />);

    expect(screen.getByText(/mijn professionals/i)).toBeInTheDocument();
    expect(screen.getByText('Ryan Dijkstra')).toBeInTheDocument();
    expect(screen.getByText('Andere Prof')).toBeInTheDocument();
    expect(screen.getByText(/Bernard — 1/)).toBeInTheDocument();
    expect(screen.getByText(/Jurgen — 1/)).toBeInTheDocument();
  });

  it('shows an empty-state message when nothing is linked yet, rather than an empty page', () => {
    render(<MyProfessionalsView displayName="Kim" summary={null} isVerified={false} verifiedAt={null} onOpenPlacement={vi.fn()} onVerify={vi.fn()} />);
    expect(screen.getByText(/nog geen plaatsingen aan jou gekoppeld/i)).toBeInTheDocument();
  });

  it('clicking ALLES KLOPT calls onVerify', async () => {
    const onVerify = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const p1 = placement({ id: 'p1' });
    const links: TalentManagerLink[] = [{ id: 'l1', projectId: 'p1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' }];
    const [summary] = buildTalentManagerSummaries([p1], links, [], []);

    render(<MyProfessionalsView displayName="Kim" summary={summary} isVerified={false} verifiedAt={null} onOpenPlacement={vi.fn()} onVerify={onVerify} />);
    await user.click(screen.getByRole('button', { name: /alles klopt/i }));
    expect(onVerify).toHaveBeenCalledTimes(1);
  });

  it('shows GECONTROLEERD instead of the button once verified', () => {
    render(<MyProfessionalsView displayName="Kim" summary={null} isVerified verifiedAt="2026-09-16T13:42:00Z" onOpenPlacement={vi.fn()} onVerify={vi.fn()} />);
    expect(screen.getByText(/gecontroleerd/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /alles klopt/i })).not.toBeInTheDocument();
  });
});
