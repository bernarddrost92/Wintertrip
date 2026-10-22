import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HUNT_TEST_STANDINGS } from '../hunt/huntTestStandings';
import { JanuaryForecastSection } from './JanuaryForecastSection';

const forecast = {
  calculatedAt: '2026-10-22',
  baselineDate: '2026-09-01',
  measureDate: '2027-01-31',
  teams: [
    { team: 'Maastricht', fteBaseline: 62.16, fteMeasure: 67.45, netFte: 5.29 },
    { team: 'Zwolle', fteBaseline: 88.64, fteMeasure: 89.77, netFte: 1.13 },
    { team: 'Rotterdam', fteBaseline: 92, fteMeasure: 75.74, netFte: -16.26 },
  ],
};

describe('JanuaryForecastSection', () => {
  it('shows the forecast as a projection, with Zwolle’s line and the full table', () => {
    render(<JanuaryForecastSection forecast={forecast} standings={HUNT_TEST_STANDINGS} />);
    expect(screen.getByRole('heading', { name: /prognose 31 januari/i })).toBeInTheDocument();
    expect(screen.getByText('Projectie')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-own')).toHaveTextContent('Zwolle: +1,13 FTE → Net FTE #2 → factor 2,0x → 44.201,82 → positie #1');
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getByText('−16,26')).toBeInTheDocument();
  });
});
