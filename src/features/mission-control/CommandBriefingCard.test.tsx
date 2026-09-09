import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CommandBriefingCard } from './CommandBriefingCard';
import type { FteSnapshot, PowerBiIntelligenceSnapshot, RankingSnapshot } from '../../types/missionSnapshot';

function ranking(virtualPosition: number | null): RankingSnapshot {
  return { virtualPosition, snapshotUpdatedAt: null };
}

function powerBi(overrides: Partial<PowerBiIntelligenceSnapshot> = {}): PowerBiIntelligenceSnapshot {
  return {
    vcdbRanking: null,
    vcdbScore: null,
    placementsInScope: null,
    placementsExtraHoursRule: null,
    finalScore: null,
    topThree: [],
    updatedAt: null,
    ...overrides,
  };
}

function fte(overrides: Partial<FteSnapshot> = {}): FteSnapshot {
  return {
    baselineFte: null,
    projectedFteOnJan31: null,
    targetFteOnJan31: null,
    expiringBeforeJan31Fte: null,
    snapshotUpdatedAt: null,
    currentNetFte: null,
    netFteRanking: null,
    currentNumberOneBenchmark: null,
    currentFteFactor: null,
    fteMilestones: [],
    ...overrides,
  };
}

const TOP_THREE = [
  { position: 1, team: 'Zwolle', finalScore: 16646.21 },
  { position: 2, team: 'Maastricht', finalScore: 12708.85 },
  { position: 3, team: 'Eindhoven', finalScore: 11948.05 },
];

describe('CommandBriefingCard', () => {
  it('virtualPosition = 1 -> gold state, #1, Power BI Final Score, lead vs #2, FTE position + factor', () => {
    render(
      <CommandBriefingCard
        ranking={ranking(1)}
        powerBi={powerBi({ finalScore: 16646.21, topThree: TOP_THREE })}
        fte={fte({ netFteRanking: 9, currentFteFactor: 1.3 })}
      />,
    );
    expect(screen.getByText('#1').closest('[data-podium-state]')).toHaveAttribute('data-podium-state', 'gold');
    expect(screen.getAllByText('16.646,21').length).toBeGreaterThan(0);
    expect(screen.getByText(/\+3\.937,36 vs #2 maastricht/i)).toBeInTheDocument();
    expect(screen.getByText(/fte position #9/i)).toBeInTheDocument();
    expect(screen.getByText(/factor 1,3x/i)).toBeInTheDocument();
  });

  it('virtualPosition = 2 -> silver state', () => {
    render(<CommandBriefingCard ranking={ranking(2)} powerBi={powerBi()} fte={fte()} />);
    expect(screen.getByText('#2').closest('[data-podium-state]')).toHaveAttribute('data-podium-state', 'silver');
  });

  it('virtualPosition = 3 -> bronze state', () => {
    render(<CommandBriefingCard ranking={ranking(3)} powerBi={powerBi()} fte={fte()} />);
    expect(screen.getByText('#3').closest('[data-podium-state]')).toHaveAttribute('data-podium-state', 'bronze');
  });

  it('virtualPosition = 4 -> default state', () => {
    render(<CommandBriefingCard ranking={ranking(4)} powerBi={powerBi()} fte={fte()} />);
    expect(screen.getByText('#4').closest('[data-podium-state]')).toHaveAttribute('data-podium-state', 'default');
  });

  it('virtualPosition = null -> Awaiting Intelligence, no fabricated position', () => {
    render(<CommandBriefingCard ranking={ranking(null)} powerBi={powerBi()} fte={fte()} />);
    expect(screen.getByText(/awaiting intelligence/i)).toBeInTheDocument();
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
  });

  it('renders the Pursuit strip in order, Zwolle dominant', () => {
    render(<CommandBriefingCard ranking={ranking(1)} powerBi={powerBi({ finalScore: 16646.21, topThree: TOP_THREE })} fte={fte()} />);
    expect(screen.getByText(/1 · zwolle/i)).toBeInTheDocument();
    expect(screen.getByText(/2 · maastricht/i)).toBeInTheDocument();
    expect(screen.getByText(/3 · eindhoven/i)).toBeInTheDocument();
    expect(screen.getByText('−3.937,36')).toBeInTheDocument();
    expect(screen.getByText('−4.698,16')).toBeInTheDocument();
  });

  it('no Top 3 data -> no Pursuit strip, no lead line, but the hero still renders', () => {
    render(<CommandBriefingCard ranking={ranking(1)} powerBi={powerBi()} fte={fte()} />);
    expect(screen.queryByText(/vs #2/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('#1').length).toBeGreaterThan(0);
  });
});
