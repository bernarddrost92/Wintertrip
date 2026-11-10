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
    expect(zwolle.className).toContain('bg-gold/[0.09]');
  });

  it('is labelled as the official stand', () => {
    render(<StandingsTable standings={standings} updatedAt={updatedAt} />);
    expect(screen.getByText('Officieel')).toBeInTheDocument();
  });

  // Fixed fixtures, so these do not depend on whether today's screenshot
  // happens to show every team.
  it('notes a hidden Net FTE rank when a team is missing from the Final Ranking', () => {
    const withHidden = standings.filter((row) => row.team !== 'Zwolle').map((row, i) => ({ ...row, finalRanking: i + 1 }));
    const ranks = hiddenNetFteRanks(withHidden);
    expect(ranks.length).toBeGreaterThan(0);
    render(<StandingsTable standings={withHidden} updatedAt={updatedAt} />);
    const hidden = ranks.map((r) => `#${r}`).join(', ');
    expect(screen.getByText(`Net FTE-rang ${hidden} hoort bij een team dat niet in de eindstand staat.`)).toBeInTheDocument();
  });

  it('leaves the hidden-rank note out when every Net FTE rank is a visible team', () => {
    const complete = standings.map((row, i) => ({ ...row, netFteRanking: i + 1 }));
    expect(hiddenNetFteRanks(complete)).toEqual([]);
    render(<StandingsTable standings={complete} updatedAt={updatedAt} />);
    expect(screen.queryByText(/hoort bij een team dat niet in de eindstand staat/)).not.toBeInTheDocument();
  });
});
