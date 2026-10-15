import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MANUAL_POWER_BI_SNAPSHOT } from '../../data/manualPowerBiSnapshot';
import { hiddenNetFteRanks } from '../../services/netFteProjection';
import { StandingsTable } from './StandingsTable';

describe('StandingsTable', () => {
  const { standings, updatedAt } = MANUAL_POWER_BI_SNAPSHOT;

  it('lists every team with VCDB, Net FTE, FTE rank, factor and Final Score', () => {
    render(<StandingsTable standings={standings} updatedAt={updatedAt} />);
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers).toEqual(['#', 'Team', 'VCDB', 'Net FTE', 'FTE #', 'Factor', 'Final Score']);
    expect(screen.getAllByRole('row')).toHaveLength(standings.length + 1);
  });

  it('Zwolle’s row stands out', () => {
    render(<StandingsTable standings={standings} updatedAt={updatedAt} />);
    const zwolle = screen.getByRole('row', { current: true });
    expect(within(zwolle).getByText('Zwolle')).toBeInTheDocument();
    expect(zwolle.className).toContain('bg-gold/15');
  });

  it('is labelled as the official stand and notes the hidden Net FTE rank', () => {
    render(<StandingsTable standings={standings} updatedAt={updatedAt} />);
    expect(screen.getByText('Officieel')).toBeInTheDocument();
    const hidden = hiddenNetFteRanks(standings).map((r) => `#${r}`).join(', ');
    expect(screen.getByText(`Net FTE-rang ${hidden} hoort bij een team dat niet in de eindstand staat.`)).toBeInTheDocument();
  });
});
