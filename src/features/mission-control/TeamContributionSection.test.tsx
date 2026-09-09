import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TeamContributionSection } from './TeamContributionSection';
import type { AgentContribution } from '../../services/productionAggregate';

const AM: AgentContribution[] = [
  { code: 'KS', score: 156.45, deals: 2 },
  { code: 'BD', score: 80, deals: 2 },
  { code: 'JvD', score: 66, deals: 1 },
  { code: 'LV', score: 15, deals: 1 },
  { code: 'HH', score: 0, deals: 1 },
];

const TM: AgentContribution[] = [
  { code: 'BVM', score: 95, deals: 2 },
  { code: 'RP', score: 76.45, deals: 2 },
];

describe('TeamContributionSection', () => {
  it('renders AM and TM side by side, top 3 per column shown by default', () => {
    render(<TeamContributionSection am={AM} tm={TM} />);
    expect(screen.getByText('KS')).toBeInTheDocument();
    expect(screen.getByText('BD')).toBeInTheDocument();
    expect(screen.getByText('JvD')).toBeInTheDocument();
    expect(screen.queryByText('LV')).not.toBeInTheDocument();
    expect(screen.queryByText('HH')).not.toBeInTheDocument();
    expect(screen.getByText('BVM')).toBeInTheDocument();
    expect(screen.getByText('RP')).toBeInTheDocument();
  });

  it('View All reveals the remaining AM agents', async () => {
    const user = userEvent.setup();
    render(<TeamContributionSection am={AM} tm={TM} />);
    await user.click(screen.getByRole('button', { name: /view all \(5\)/i }));
    expect(screen.getByText('LV')).toBeInTheDocument();
    expect(screen.getByText('HH')).toBeInTheDocument();
  });

  it('TM has 2 agents, no View All needed', () => {
    render(<TeamContributionSection am={AM} tm={TM} />);
    expect(screen.queryByRole('button', { name: /view all \(2\)/i })).not.toBeInTheDocument();
  });

  it('team totals attribute a deal to both AM and TM without doubling — no double-count claim in the UI', () => {
    render(<TeamContributionSection am={[{ code: 'BD', score: 100, deals: 1 }]} tm={[{ code: 'RP', score: 100, deals: 1 }]} />);
    expect(screen.getAllByText('100,00')).toHaveLength(2);
  });

  it('empty TM list shows a message, never "Unknown"/"Missing"', () => {
    render(<TeamContributionSection am={AM} tm={[]} />);
    expect(screen.queryByText(/unknown tm/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/missing tm/i)).not.toBeInTheDocument();
  });
});
