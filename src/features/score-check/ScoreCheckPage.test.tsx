import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MissionFlowProvider } from '../missionFlow/MissionFlowProvider';
import { ScoreCheckPage } from './ScoreCheckPage';

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured: () => false, getSupabaseClient: vi.fn() }));

function renderScoreCheck() {
  return render(
    <MissionFlowProvider>
      <ScoreCheckPage />
    </MissionFlowProvider>,
  );
}

function fillNewPlacement() {
  fireEvent.change(screen.getByLabelText('Startdatum'), { target: { value: '2026-10-01' } });
  fireEvent.change(screen.getByLabelText('Einddatum'), { target: { value: '2027-03-31' } });
  fireEvent.change(screen.getByLabelText('VCDB per volledige maand'), { target: { value: '1000' } });
}

function steps() {
  return within(screen.getByRole('list', { name: /score check stappen/i }));
}

describe('ScoreCheckPage — Calculator and League Check as one flow', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
  });

  it('opens on step 1 (Calculator) with both steps visible', () => {
    renderScoreCheck();
    expect(steps().getByRole('button', { name: /stap 1 · bereken score/i })).toHaveAttribute('aria-current', 'step');
    expect(steps().getByRole('button', { name: /stap 2 · league-impact/i })).not.toHaveAttribute('aria-current');
    expect(screen.getByLabelText('VCDB per volledige maand')).toBeVisible();
  });

  it('"Door naar League Check" carries the calculation into step 2 — nothing to re-enter', async () => {
    const user = userEvent.setup();
    renderScoreCheck();
    fillNewPlacement();

    await user.click(screen.getByRole('button', { name: /door naar league check/i }));

    expect(steps().getByRole('button', { name: /stap 2/i })).toHaveAttribute('aria-current', 'step');
    const banner = screen.getByText(/vanuit calculator/i).parentElement!;
    expect(banner).toBeVisible();
    expect(within(banner).getByText('Nieuwe plaatsing')).toBeInTheDocument();
  });

  it('"Terug naar berekening" returns to the same inputs', async () => {
    const user = userEvent.setup();
    renderScoreCheck();
    fillNewPlacement();
    await user.click(screen.getByRole('button', { name: /door naar league check/i }));

    await user.click(screen.getByRole('button', { name: /terug naar berekening/i }));

    expect(steps().getByRole('button', { name: /stap 1/i })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByLabelText('VCDB per volledige maand')).toHaveValue(1000);
  });

  it('"Nieuwe berekening" clears the calculator and the League Check', async () => {
    const user = userEvent.setup();
    renderScoreCheck();
    fillNewPlacement();
    await user.click(screen.getByRole('button', { name: /door naar league check/i }));

    await user.click(screen.getByRole('button', { name: /nieuwe berekening/i }));

    expect(steps().getByRole('button', { name: /stap 1/i })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByLabelText('VCDB per volledige maand')).toHaveValue(null);
    expect(screen.queryByText(/vanuit calculator/i)).not.toBeInTheDocument();
  });

  it('League Check still works on its own via step 2', async () => {
    const user = userEvent.setup();
    renderScoreCheck();

    await user.click(steps().getByRole('button', { name: /stap 2/i }));

    expect(screen.getByRole('heading', { name: 'League Check' })).toBeVisible();
    expect(screen.queryByText(/vanuit calculator/i)).not.toBeInTheDocument();
  });
});
