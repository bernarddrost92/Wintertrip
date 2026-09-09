import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreIntelligenceSection } from './ScoreIntelligenceSection';
import type { TeamProductionTotal } from '../../services/productionAggregate';
import type { PowerBiIntelligenceSnapshot } from '../../types/missionSnapshot';

function team(overrides: Partial<TeamProductionTotal> = {}): TeamProductionTotal {
  return { totalBaseLeaguePoints: 317.45, qualifyingDeals: 5, scoringPending: 2, ...overrides };
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

describe('ScoreIntelligenceSection', () => {
  it('shows Base League Points, VCDB Score, and Power BI Final Score as three clearly separate readings', () => {
    render(
      <ScoreIntelligenceSection
        team={team()}
        mock={false}
        degraded={false}
        powerBi={powerBi({ vcdbScore: 12804.78, finalScore: 16646.21 })}
        currentFteFactor={1.3}
      />,
    );
    expect(screen.getByText('317,45')).toBeInTheDocument();
    expect(screen.getByText('12.804,78')).toBeInTheDocument();
    expect(screen.getByText('16.646,21')).toBeInTheDocument();
    expect(screen.getByText(/live production feed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/official power bi snapshot/i)).toHaveLength(2);
  });

  it('qualifying/pending appear compactly under Base League Points', () => {
    render(<ScoreIntelligenceSection team={team({ qualifyingDeals: 5, scoringPending: 2 })} mock={false} degraded={false} powerBi={powerBi()} currentFteFactor={null} />);
    expect(screen.getByText(/5 qualifying · 2 pending/i)).toBeInTheDocument();
  });

  it('current FTE factor shown compactly under the Final Score', () => {
    render(<ScoreIntelligenceSection team={team()} mock={false} degraded={false} powerBi={powerBi()} currentFteFactor={1.3} />);
    expect(screen.getByText(/current fte factor · 1,3x/i)).toBeInTheDocument();
  });

  it('mock data -> a compact warning strip, not a large dashboard block', () => {
    render(<ScoreIntelligenceSection team={team()} mock={true} degraded={false} powerBi={powerBi()} currentFteFactor={null} />);
    expect(screen.getByText(/mock data/i)).toBeInTheDocument();
  });

  it('no mock/degraded -> no warning strip', () => {
    render(<ScoreIntelligenceSection team={team()} mock={false} degraded={false} powerBi={powerBi()} currentFteFactor={null} />);
    expect(screen.queryByText(/mock data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/data connection degraded/i)).not.toBeInTheDocument();
  });
});
