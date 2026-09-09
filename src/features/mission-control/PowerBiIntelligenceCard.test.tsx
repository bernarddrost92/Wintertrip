import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PowerBiIntelligenceCard } from './PowerBiIntelligenceCard';
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

describe('PowerBiIntelligenceCard', () => {
  it('renders the VCDB score and ranking', () => {
    render(<PowerBiIntelligenceCard powerBi={powerBi({ vcdbRanking: 1, vcdbScore: 12804.78 })} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('12.804,78')).toBeInTheDocument();
  });

  it('renders the Power BI Virtual Final Score, clearly labelled separate from Base League Points', () => {
    render(<PowerBiIntelligenceCard powerBi={powerBi({ finalScore: 16646.21 })} />);
    expect(screen.getByText('16.646,21')).toBeInTheDocument();
    expect(screen.getByText(/power bi virtual final score/i)).toBeInTheDocument();
    expect(screen.getByText(/separate from mission control/i)).toBeInTheDocument();
  });

  it('renders the Virtual Top 3 in order', () => {
    render(
      <PowerBiIntelligenceCard
        powerBi={powerBi({
          topThree: [
            { position: 1, team: 'Zwolle', finalScore: 16646.21 },
            { position: 2, team: 'Maastricht', finalScore: 12708.85 },
            { position: 3, team: 'Eindhoven', finalScore: 11948.05 },
          ],
        })}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(/1 · zwolle/i);
    expect(items[0]).toHaveTextContent('16.646,21');
    expect(items[1]).toHaveTextContent(/2 · maastricht/i);
    expect(items[2]).toHaveTextContent(/3 · eindhoven/i);
  });

  it('no top three data -> the list is simply omitted, not shown empty', () => {
    render(<PowerBiIntelligenceCard powerBi={powerBi({ topThree: [] })} />);
    expect(screen.queryByText(/virtual top 3/i)).not.toBeInTheDocument();
  });

  it('renders the last refresh timestamp in Europe/Amsterdam time regardless of viewer timezone', () => {
    render(<PowerBiIntelligenceCard powerBi={powerBi({ updatedAt: '2026-09-09T05:07:00+02:00' })} />);
    expect(screen.getByText('09 SEP 2026 · 05:07 · Manual Snapshot')).toBeInTheDocument();
  });

  it('no timestamp -> Awaiting Update', () => {
    render(<PowerBiIntelligenceCard powerBi={powerBi({ updatedAt: null })} />);
    expect(screen.getByText(/awaiting update/i)).toBeInTheDocument();
  });
});
