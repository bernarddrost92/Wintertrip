import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCinematicChecks } from './cinematicAssets';
import { HuntModeOverlay } from './HuntModeOverlay';
import { HUNT_MISSIONS, HUNT_ONE_LINERS } from './huntLines';

const { fetchFteBonnen } = vi.hoisted(() => ({ fetchFteBonnen: vi.fn() }));
vi.mock('../../services/fteBonnen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/fteBonnen')>()),
  fetchFteBonnen,
}));
vi.mock('../../data/manualPowerBiSnapshot', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/manualPowerBiSnapshot')>();
  const { HUNT_TEST_STANDINGS } = await import('./huntTestStandings');
  return { ...actual, MANUAL_POWER_BI_SNAPSHOT: { updatedAt: '2026-10-13', standings: HUNT_TEST_STANDINGS } };
});

function mockMedia({ reduced = false, mobile = false } = {}) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: (reduced && query.includes('prefers-reduced-motion')) || (mobile && query.includes('max-width: 720px')),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/** The HEAD probe for public/cinematic/*: 404 by default. */
function mockCinematic({ video = false, poster = false } = {}) {
  resetCinematicChecks();
  globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
    const isVideo = /hunt-room-loop\.(webm|mp4)$/.test(url);
    const isPoster = /hunt-room-poster\.webp$/.test(url);
    const ok = (isVideo && video) || (isPoster && poster);
    return { ok, headers: new Headers(ok ? { 'content-type': isVideo ? 'video/webm' : 'image/webp' } : {}) };
  }) as unknown as typeof fetch;
}

const OPEN_BON = { id: 'a', label: 'JdV', type: 'VERLENGING', fteDelta: 0.5, owner: 'TM', note: null, status: 'open', createdAt: '2026-10-13T08:00:00Z' };

function renderOverlay(props: Partial<Parameters<typeof HuntModeOverlay>[0]> = {}) {
  const onExit = vi.fn();
  const onPakFteBon = vi.fn();
  render(<HuntModeOverlay fromActivation={false} onExit={onExit} onPakFteBon={onPakFteBon} {...props} />);
  return { onExit, onPakFteBon };
}

const hero = () => within(screen.getByRole('region', { name: /the net fte hunt is on/i }));
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe('HuntModeOverlay — approved design: scene → target → action', () => {
  beforeEach(() => {
    mockMedia();
    mockCinematic();
    fetchFteBonnen.mockReset();
    fetchFteBonnen.mockResolvedValue([]);
  });

  it('opens as a modal with the headline and one live strip: VCDB, target in the centre, Net FTE', async () => {
    renderOverlay();
    expect(screen.getByRole('dialog', { name: /the net fte hunt is on/i })).toHaveAttribute('aria-modal', 'true');
    expect(document.querySelector('.hunt3-kicker-top')).toHaveTextContent('Team Zwolle // live intelligence');
    expect(hero().getByRole('group', { name: 'Onze kracht · VCDB' })).toHaveTextContent('#1');
    expect(hero().getByRole('group', { name: 'De missie · Net FTE' })).toHaveTextContent('#10');
    const target = hero().getByRole('group', { name: 'Target acquired' });
    expect(target).toHaveTextContent('#9 Utrecht');
    expect(target).toHaveTextContent('+0,19 FTE');
    await waitFor(() => expect(fetchFteBonnen).toHaveBeenCalled());
  });

  it('target and FTE needed follow the open FTE-bonnen', async () => {
    fetchFteBonnen.mockResolvedValue([OPEN_BON]);
    renderOverlay();
    await waitFor(() => expect(screen.getByTestId('hunt-next-target')).toHaveTextContent('#8 Leeuwarden'));
    expect(screen.getByTestId('hunt-next-target')).toHaveTextContent('+2,39 FTE');
  });

  it('no target left: TARGET SECURED · NET FTE #1 · VASTHOUDEN', async () => {
    fetchFteBonnen.mockResolvedValue([{ ...OPEN_BON, fteDelta: 20 }]);
    renderOverlay();
    const target = await screen.findByRole('group', { name: 'Target secured' });
    expect(target).toHaveTextContent(/target secured/i);
    expect(target).toHaveTextContent('Net FTE #1');
    expect(target).toHaveTextContent(/vasthouden/i);
  });

  it('shows the three actions, the four moves as one strip and the Net FTE rule', () => {
    renderOverlay();
    for (const name of [/geef mij een missie/i, /^pak fte-bon/i, /geef me vuur/i]) expect(hero().getByRole('button', { name })).toBeInTheDocument();
    const moves = within(screen.getByRole('region', { name: /vier routes naar net fte/i }));
    for (const move of ['Verlengen', 'PO → contract', 'Nieuwe contractant', 'Uren ophogen']) expect(moves.getByText(move)).toBeInTheDocument();
    expect(screen.getByText('Net FTE = BPT + VD')).toBeInTheDocument();
    expect(screen.getByText('PO telt niet mee')).toBeInTheDocument();
    // In the first viewport: the bottom line on desktop, under the moves on mobile.
    expect(screen.getAllByText('Net FTE = BPT + VD · PO telt niet mee')).toHaveLength(2);
  });

  it('the target locks once: a ring and a scan line timed off the strip, FTE needed a beat later — nothing loops', () => {
    renderOverlay({ fromActivation: true });
    const target = screen.getByTestId('hunt-next-target');
    expect(target.style.getPropertyValue('--hunt3-lock-delay')).toBe('1950ms');
    expect(target.querySelector('.hunt3-lock-ring')).not.toBeNull();
    expect(target.querySelector('.hunt3-lock-scan')).not.toBeNull();
    expect(within(target).getByText('+0,19 FTE')).toHaveClass('hunt3-after-lock');
    expect(document.querySelector('[data-testid="hunt-mode"] [class*="animate-"][class*="infinite"]')).toBeNull();
  });

  it('no permanent mission or motivation boxes in the room', () => {
    renderOverlay();
    expect(screen.queryByTestId('hunt-reveal')).not.toBeInTheDocument();
    expect(screen.queryByText(/mission brief/i)).not.toBeInTheDocument();
  });

  it('keeps the secondary intelligence below the fold: factor, final position, open bonnen, projection, Power BI date', async () => {
    fetchFteBonnen.mockResolvedValue([OPEN_BON]);
    renderOverlay();
    const intel = within(screen.getByRole('region', { name: /secundaire intelligence/i }));
    await waitFor(() => expect(intel.getByText('1 open')).toBeInTheDocument());
    expect(intel.getByText('Factor').nextSibling).toHaveTextContent('1,3x');
    expect(intel.getByText('Eindstand').nextSibling).toHaveTextContent('#2');
    expect(intel.getByText('Open FTE-bonnen').nextSibling).toHaveTextContent('+0,50');
    expect(intel.getByText('Projectie FTE-rank').nextSibling).toHaveTextContent('#9');
    expect(intel.getByText('Projectie Net FTE').nextSibling).toHaveTextContent('-7,28');
    expect(intel.getByText('Projectie Net FTE').parentElement).toHaveClass('hunt3-intel-blue');
    expect(intel.getByText(/power bi 13 oct 2026/i)).toBeInTheDocument();
  });

  describe('activation → hero sequence', () => {
    it('after a deliberate activation the room fades in at 1.45s and the hero enters on the timeline', () => {
      renderOverlay({ fromActivation: true });
      expect(screen.getByTestId('hunt-mode').className).not.toContain('intro-quickfade');
      expect(screen.getByTestId('hunt-backdrop')).toHaveClass('hunt3-enter-room');
      expect(document.querySelector('.hunt3-topbar')).toHaveClass('hunt3-enter-room');
      const h = hero();
      expect(document.querySelector('.hunt3-kicker')).toHaveStyle({ animationDelay: '1650ms' });
      expect(h.getByRole('heading', { name: /the net fte hunt is on/i })).toHaveStyle({ animationDelay: '1750ms' });
      expect(document.querySelector('.hunt3-live-strip')).toHaveStyle({ animationDelay: '1950ms' });
      expect(document.querySelector('.hunt3-actions')).toHaveStyle({ animationDelay: '2150ms' });
      expect(screen.getByRole('region', { name: /vier routes naar net fte/i }).parentElement).toHaveStyle({ animationDelay: '2300ms' });
    });

    it('a plain open (restore after reload) is a short quiet stagger with no 1.45s wait', () => {
      renderOverlay();
      expect(screen.getByTestId('hunt-backdrop')).not.toHaveClass('hunt3-enter-room');
      expect(hero().getByRole('heading', { name: /the net fte hunt is on/i })).toHaveStyle({ animationDelay: '80ms' });
    });

    it('with reduced motion everything is there at once', () => {
      mockMedia({ reduced: true });
      renderOverlay({ fromActivation: true });
      expect(screen.getByTestId('hunt-backdrop')).not.toHaveClass('hunt3-enter-room');
      expect(hero().getByRole('heading', { name: /the net fte hunt is on/i })).toHaveStyle({ animationDelay: '0ms' });
    });
  });

  describe('reveals', () => {
    it('GEEF MIJ EEN MISSIE opens the reveal with a mission; NOG EEN MISSIE swaps it in place', async () => {
      const user = userEvent.setup();
      renderOverlay();
      await user.click(hero().getByRole('button', { name: /geef mij een missie/i }));
      const reveal = screen.getByTestId('hunt-reveal');
      expect(within(reveal).getByText(/missie \/\/ secure channel/i)).toBeInTheDocument();
      const first = screen.getByTestId('hunt-reveal-text').dataset.text;
      expect(HUNT_MISSIONS).toContain(first);
      await user.click(within(reveal).getByRole('button', { name: /nog een missie/i }));
      expect(screen.getByTestId('hunt-reveal-text')).toHaveClass('hunt3-reveal-out');
      await waitFor(() => expect(screen.getByTestId('hunt-reveal-text').dataset.text).not.toBe(first));
      expect(HUNT_MISSIONS).toContain(screen.getByTestId('hunt-reveal-text').dataset.text);
      expect(screen.getByTestId('hunt-reveal-text')).toHaveClass('hunt3-reveal-in');
      // Same overlay, not remounted.
      expect(screen.getByTestId('hunt-reveal')).toBe(reveal);
    });

    it('GEEF ME VUUR opens the reveal with a one-liner, gold last line; NOG ÉÉN swaps it — no confetti', async () => {
      const user = userEvent.setup();
      renderOverlay();
      await user.click(hero().getByRole('button', { name: /geef me vuur/i }));
      const first = screen.getByTestId('hunt-reveal-text').dataset.text;
      expect(HUNT_ONE_LINERS).toContain(first);
      expect(screen.getByTestId('hunt-reveal-text').querySelector('.hunt3-gold-line')).not.toBeNull();
      await user.click(screen.getByRole('button', { name: /nog één/i }));
      await waitFor(() => expect(screen.getByTestId('hunt-reveal-text').dataset.text).not.toBe(first));
      expect(HUNT_ONE_LINERS).toContain(screen.getByTestId('hunt-reveal-text').dataset.text);
      expect(screen.queryByTestId('gold-confetti')).not.toBeInTheDocument();
    });

    it('with reduced motion the line swaps instantly', async () => {
      mockMedia({ reduced: true });
      const user = userEvent.setup();
      renderOverlay();
      await user.click(hero().getByRole('button', { name: /geef me vuur/i }));
      const first = screen.getByTestId('hunt-reveal-text').dataset.text;
      await user.click(screen.getByRole('button', { name: /nog één/i }));
      expect(screen.getByTestId('hunt-reveal-text').dataset.text).not.toBe(first);
    });

    it('TERUG NAAR ROOM closes the reveal and returns focus to its button', async () => {
      const user = userEvent.setup();
      renderOverlay();
      await user.click(hero().getByRole('button', { name: /geef mij een missie/i }));
      await user.click(screen.getByRole('button', { name: /terug naar room/i }));
      expect(screen.queryByTestId('hunt-reveal')).not.toBeInTheDocument();
      expect(hero().getByRole('button', { name: /geef mij een missie/i })).toHaveFocus();
    });
  });

  describe('Escape hierarchy: reveal → War Room → Hunt Mode', () => {
    it('Escape closes the reveal first, then Hunt Mode', async () => {
      const user = userEvent.setup();
      const { onExit } = renderOverlay();
      await user.click(hero().getByRole('button', { name: /geef me vuur/i }));
      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('hunt-reveal')).not.toBeInTheDocument();
      expect(onExit).not.toHaveBeenCalled();
      await user.keyboard('{Escape}');
      expect(onExit).toHaveBeenCalledTimes(1);
    });

    it('Escape closes the War Room first and returns to the same Hunt Room, then Hunt Mode', async () => {
      const user = userEvent.setup();
      const { onExit } = renderOverlay();
      const dialog = screen.getByTestId('hunt-mode');
      dialog.scrollTop = 420;
      await user.click(screen.getByRole('button', { name: /open war room/i }));
      expect(screen.getByTestId('war-room-line')).toHaveTextContent('TARGET ACQUIRED: UTRECHT');
      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('war-room')).not.toBeInTheDocument();
      expect(onExit).not.toHaveBeenCalled();
      expect(screen.getByTestId('hunt-mode')).toBe(dialog);
      expect(dialog.scrollTop).toBe(420);
      await user.keyboard('{Escape}');
      expect(onExit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hunt Range', () => {
    it('OPEN HUNT RANGE (top bar and below the fold) opens the range with the live next target', async () => {
      const user = userEvent.setup();
      renderOverlay();
      expect(screen.getAllByRole('button', { name: /open hunt range/i })).toHaveLength(2);
      await user.click(screen.getAllByRole('button', { name: /open hunt range/i })[0]);
      expect(screen.getByTestId('hunt-range')).toBeInTheDocument();
      expect(screen.getByTestId('range-briefing')).toHaveTextContent('UTRECHT #9');
    });

    it('Escape closes the range back to the same Hunt Room, then Hunt Mode', async () => {
      const user = userEvent.setup();
      const { onExit } = renderOverlay();
      const dialog = screen.getByTestId('hunt-mode');
      await user.click(screen.getAllByRole('button', { name: /open hunt range/i })[1]);
      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('hunt-range')).not.toBeInTheDocument();
      expect(onExit).not.toHaveBeenCalled();
      expect(screen.getByTestId('hunt-mode')).toBe(dialog);
      await user.keyboard('{Escape}');
      expect(onExit).toHaveBeenCalledTimes(1);
    });

    it('SLUIT HUNT RANGE goes back to the Hunt Room without handing off', async () => {
      const user = userEvent.setup();
      const { onPakFteBon } = renderOverlay();
      await user.click(screen.getAllByRole('button', { name: /open hunt range/i })[0]);
      expect(screen.getByRole('button', { name: /start ronde/i })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /sluit hunt range/i }));
      expect(screen.queryByTestId('hunt-range')).not.toBeInTheDocument();
      expect(onPakFteBon).not.toHaveBeenCalled();
    });

    it('no target left: the range says NO TARGETS REMAINING', async () => {
      fetchFteBonnen.mockResolvedValue([{ ...OPEN_BON, fteDelta: 20 }]);
      const user = userEvent.setup();
      const { onPakFteBon } = renderOverlay();
      await flush();
      await user.click(screen.getAllByRole('button', { name: /open hunt range/i })[0]);
      expect(screen.getByTestId('range-no-targets')).toHaveTextContent(/defend the position/i);
      await user.click(within(screen.getByTestId('range-no-targets')).getByRole('button', { name: /pak fte-bon/i }));
      expect(onPakFteBon).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('hunt-range')).not.toBeInTheDocument();
    });
  });

  it('PAK FTE-BON (hero) and PAK JE FTE-BON (below the fold) hand off to the FTE Bon Calculator', async () => {
    const user = userEvent.setup();
    const { onPakFteBon } = renderOverlay();
    await user.click(hero().getByRole('button', { name: /^pak fte-bon/i }));
    await user.click(screen.getByRole('button', { name: /pak je fte-bon/i }));
    expect(onPakFteBon).toHaveBeenCalledTimes(2);
  });

  it('EXIT HUNT MODE and Escape close Hunt Mode; focus starts on Exit and stays inside', async () => {
    const user = userEvent.setup();
    const { onExit } = renderOverlay();
    const exit = screen.getByRole('button', { name: /exit hunt mode/i });
    expect(exit).toHaveFocus();
    await user.tab();
    expect(hero().getByRole('button', { name: /geef mij een missie/i })).toHaveFocus();
    exit.focus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: /open war room/i })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getAllByRole('button', { name: /open hunt range/i })[0]).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: /pak je fte-bon/i })).toHaveFocus();
    await user.click(exit);
    expect(onExit).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    expect(onExit).toHaveBeenCalledTimes(2);
  });

  it('always opens at the top, and locks / restores the page scroll', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(<HuntModeOverlay fromActivation={false} onExit={vi.fn()} onPakFteBon={vi.fn()} />);
    expect(screen.getByTestId('hunt-mode').scrollTop).toBe(0);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  describe('cinematic backdrop', () => {
    it('stays mounted — the same element — through reveals and the War Room', async () => {
      const user = userEvent.setup();
      renderOverlay();
      const backdrop = screen.getByTestId('hunt-backdrop');
      await user.click(hero().getByRole('button', { name: /geef mij een missie/i }));
      await user.click(screen.getByRole('button', { name: /nog een missie/i }));
      await user.keyboard('{Escape}');
      await user.click(hero().getByRole('button', { name: /geef me vuur/i }));
      await user.keyboard('{Escape}');
      await user.click(screen.getByRole('button', { name: /open war room/i }));
      await user.keyboard('{Escape}');
      expect(screen.getByTestId('hunt-backdrop')).toBe(backdrop);
    });

    it('without cinematic files: no <video>, no poster, the SVG/CSS fallback scene renders', async () => {
      renderOverlay();
      await flush();
      const backdrop = screen.getByTestId('hunt-backdrop');
      expect(backdrop.querySelector('video')).toBeNull();
      expect(screen.queryByTestId('hunt-poster')).toBeNull();
      expect(backdrop.querySelector('.hunt3-video-fallback')).not.toBeNull();
      expect(backdrop.querySelectorAll('img')).toHaveLength(4);
    });

    it('a future video loads invisibly, fades in over the fallback, and a failure falls back cleanly', async () => {
      mockCinematic({ video: true, poster: true });
      renderOverlay();
      const video = await screen.findByTestId('hunt-video');
      expect(video).toHaveAttribute('preload', 'metadata');
      expect((video as HTMLVideoElement).muted).toBe(true);
      expect(video).toHaveAttribute('loop');
      expect(video).toHaveAttribute('playsinline');
      expect(video).toHaveAttribute('aria-hidden', 'true');
      expect(Array.from(video.querySelectorAll('source')).map((s) => s.getAttribute('src'))).toEqual(['/cinematic/hunt-room-loop.webm', '/cinematic/hunt-room-loop.mp4']);
      expect(video).not.toHaveClass('is-ready');
      fireEvent.loadedData(video);
      expect(video).toHaveClass('is-ready');
      const poster = screen.getByTestId('hunt-poster');
      fireEvent.load(poster);
      expect(poster).toHaveClass('is-ready');
      const backdrop = screen.getByTestId('hunt-backdrop');
      expect(backdrop.querySelector('.hunt3-video-fallback')).not.toBeNull();
      fireEvent.error(video);
      expect(screen.queryByTestId('hunt-video')).toBeNull();
      expect(backdrop.querySelector('.hunt3-video-fallback')).not.toBeNull();
    });

    it('on mobile (≤720px) there is never a background video', async () => {
      mockMedia({ mobile: true });
      mockCinematic({ video: true });
      renderOverlay();
      await flush();
      expect(screen.queryByTestId('hunt-video')).toBeNull();
    });

    it('with reduced motion there is never a background video', async () => {
      mockMedia({ reduced: true });
      mockCinematic({ video: true });
      renderOverlay();
      await flush();
      expect(screen.queryByTestId('hunt-video')).toBeNull();
    });
  });
});
