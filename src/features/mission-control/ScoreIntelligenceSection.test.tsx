import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreIntelligenceSection } from './ScoreIntelligenceSection';
import type { PowerBiIntelligenceSnapshot } from '../../types/missionSnapshot';

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
  it('shows VCDB Score and Power BI Final Score as two separate official readings', () => {
    render(<ScoreIntelligenceSection powerBi={powerBi({ vcdbScore: 12804.78, finalScore: 16646.21 })} currentFteFactor={1.3} />);
    expect(screen.getByText('12.804,78')).toBeInTheDocument();
    expect(screen.getByText('16.646,21')).toBeInTheDocument();
    expect(screen.getAllByText(/official power bi snapshot/i)).toHaveLength(2);
  });

  it('no longer shows the Marre production feed (Base League Points, mock warning)', () => {
    render(<ScoreIntelligenceSection powerBi={powerBi()} currentFteFactor={null} />);
    expect(screen.queryByText(/base league points/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/live production feed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mock data/i)).not.toBeInTheDocument();
  });

  it('current FTE factor shown compactly under the Final Score', () => {
    render(<ScoreIntelligenceSection powerBi={powerBi()} currentFteFactor={1.3} />);
    expect(screen.getByText(/current fte factor · 1,3x/i)).toBeInTheDocument();
  });

  it('missing Power BI values render a dash, never 0', () => {
    render(<ScoreIntelligenceSection powerBi={powerBi()} currentFteFactor={null} />);
    expect(screen.getAllByText('—')).toHaveLength(2);
  });
});
