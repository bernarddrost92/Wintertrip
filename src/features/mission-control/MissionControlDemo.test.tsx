import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { HUNT_TEST_STANDINGS } from '../hunt/huntTestStandings';
import { MissionControlPage } from './MissionControlPage';
import { missionControlDemoSteps } from './missionControlDemoSteps';

vi.mock('../../services/fteBonnen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/fteBonnen')>()),
  fetchFteBonnen: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../services/leagueCheckReceipts', () => ({ fetchLeagueCheckReceiptStats: vi.fn().mockResolvedValue(null) }));
vi.mock('../../data/manualPowerBiSnapshot', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/manualPowerBiSnapshot')>();
  const { HUNT_TEST_STANDINGS } = await import('../hunt/huntTestStandings');
  return { ...actual, MANUAL_POWER_BI_SNAPSHOT: { updatedAt: '2026-10-13', standings: HUNT_TEST_STANDINGS } };
});

describe('missionControlDemoSteps', () => {
  const steps = missionControlDemoSteps(HUNT_TEST_STANDINGS, '2026-10-13');
  const text = (key: string) => steps.find((s) => s.key === key)!.text;

  it('explains the figures with the live numbers', () => {
    expect(text('position')).toContain('#2 in de eindstand');
    expect(text('final')).toContain('22.100,91 × 1,3x = 28.731,19');
    expect(text('strip')).toContain('11.066,49 punten achter op Maastricht');
    expect(text('strip')).toContain('VCDB zijn we #1, maar in Net FTE #10');
    expect(text('strip')).toContain('Maastricht heeft minder VCDB (15.919,07), maar factor 2,5x');
    expect(text('targets')).toContain('+0,19 FTE om #9 Utrecht te passeren');
    expect(text('table')).toContain('#1 2,5x · #2 2,0x');
    expect(text('table')).toContain('daarna 1,0x');
  });

  it('reads differently once Zwolle is #1', () => {
    const top = HUNT_TEST_STANDINGS.map((r) => (r.team === OWN_TEAM ? { ...r, finalRanking: 1 } : r.finalRanking === 1 ? { ...r, finalRanking: 2 } : r));
    const s = missionControlDemoSteps(top, '2026-10-13');
    expect(s.find((x) => x.key === 'strip')!.text).toMatch(/we staan bovenaan/i);
  });
});

describe('Mission Control demo', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('walks past every block, one at a time, and ends cleanly', async () => {
    render(<MissionControlPage />);
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: /demo: leg de cijfers uit/i }));
    const demo = () => within(screen.getByTestId('demo-coach'));
    const selectors = ['mc-position', 'mc-final', 'mc-strip', 'mc-columns', 'mc-targets'];
    for (const [i, key] of selectors.entries()) {
      expect(demo().getByText(`Demo · stap ${i + 1} van 7`)).toBeInTheDocument();
      expect(document.querySelector(`[data-demo="${key}"]`)).toHaveAttribute('data-demo-focus');
      expect(document.querySelectorAll('[data-demo-focus]')).toHaveLength(1);
      expect(demo().queryByRole('button', { name: /vul voor mij in/i })).not.toBeInTheDocument();
      fireEvent.click(demo().getByRole('button', { name: /volgende/i }));
    }
    expect(document.querySelector('tr[aria-current="true"]')).toHaveAttribute('data-demo-focus');
    fireEvent.click(demo().getByRole('button', { name: /volgende/i }));
    expect(demo().getByRole('heading', { name: 'De conclusie' })).toBeInTheDocument();
    fireEvent.click(demo().getByRole('button', { name: /klaar/i }));
    expect(screen.queryByTestId('demo-coach')).not.toBeInTheDocument();
    expect(document.querySelector('[data-demo-focus]')).toBeNull();
  });
});
