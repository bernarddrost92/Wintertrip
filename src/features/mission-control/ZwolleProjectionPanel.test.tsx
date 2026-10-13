import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MANUAL_POWER_BI_SNAPSHOT } from '../../data/manualPowerBiSnapshot';
import { ZwolleProjectionPanel } from './ZwolleProjectionPanel';

const { fetchFteBonnen } = vi.hoisted(() => ({ fetchFteBonnen: vi.fn() }));

vi.mock('../../services/fteBonnen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/fteBonnen')>()),
  fetchFteBonnen,
}));

describe('ZwolleProjectionPanel', () => {
  it('shows the official stand and the projection as two separately labelled blocks', async () => {
    fetchFteBonnen.mockResolvedValue([
      { id: 'a', label: 'AB', type: 'VERLENGING', fteDelta: 1.4, owner: null, note: null, status: 'open', createdAt: 't' },
    ]);
    render(<ZwolleProjectionPanel standings={MANUAL_POWER_BI_SNAPSHOT.standings} />);

    expect(screen.getByText('Officieel')).toBeInTheDocument();
    expect(screen.getByText('Projectie')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/\+1,40 FTE · 1 open bonnen/)).toBeInTheDocument());
  });

  it('names the first team to pass in the Final Ranking, with the Net FTE and VCDB routes', async () => {
    fetchFteBonnen.mockResolvedValue([]);
    render(<ZwolleProjectionPanel standings={MANUAL_POWER_BI_SNAPSHOT.standings} />);
    await waitFor(() => expect(screen.getByText(/0 open bonnen/)).toBeInTheDocument());

    expect(screen.getByText(/eerst te pakken/i)).toBeInTheDocument();
    expect(screen.getByText(/via net fte:/i)).toBeInTheDocument();
    expect(screen.getByText(/via vcdb:/i)).toBeInTheDocument();
    expect(screen.getByText(/volgende in net fte/i)).toBeInTheDocument();
  });
});
