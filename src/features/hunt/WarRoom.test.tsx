import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { getHuntIntel } from './huntIntel';
import { WAR_ROOM_LINES, warRoomLines } from './huntLines';
import { HUNT_TEST_STANDINGS } from './huntTestStandings';
import { WAR_ROOM_LINE_MS, WarRoom } from './WarRoom';
import { warRoomImpact } from './warRoomMoves';

function mockMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const intel = getHuntIntel(HUNT_TEST_STANDINGS, OWN_TEAM, 0);

describe('warRoomLines', () => {
  it('leads with the live target, then the fixed War Room lines', () => {
    expect(warRoomLines(intel).slice(0, 2)).toEqual(['TARGET ACQUIRED: UTRECHT', '+0,19 FTE. DAN IS UTRECHT VAN ONS.']);
    expect(warRoomLines(intel).slice(2)).toEqual([...WAR_ROOM_LINES]);
  });

  it('has a hold-the-lead line once Zwolle is #1 in Net FTE', () => {
    expect(warRoomLines(getHuntIntel(HUNT_TEST_STANDINGS, OWN_TEAM, 20))[0]).toBe('#1 IN NET FTE. VASTHOUDEN.');
  });
});

describe('WarRoom', () => {
  afterEach(() => vi.useRealTimers());

  it('opens with confetti and flying one-liners, and the centre line keeps changing', () => {
    vi.useFakeTimers();
    mockMotion(false);
    render(<WarRoom intel={intel} onClose={vi.fn()} onPakFteBon={vi.fn()} />);
    expect(screen.getByTestId('gold-confetti')).toBeInTheDocument();
    expect(screen.getByTestId('war-room-line')).toHaveTextContent('TARGET ACQUIRED: UTRECHT');
    act(() => vi.advanceTimersByTime(WAR_ROOM_LINE_MS));
    expect(screen.getByTestId('war-room-line')).toHaveTextContent('+0,19 FTE. DAN IS UTRECHT VAN ONS.');
  });

  it('with reduced motion: no confetti or flying lines, the centre line still works', () => {
    vi.useFakeTimers();
    mockMotion(true);
    render(<WarRoom intel={intel} onClose={vi.fn()} onPakFteBon={vi.fn()} />);
    expect(screen.queryByTestId('gold-confetti')).not.toBeInTheDocument();
    expect(screen.getByTestId('war-room-line')).toHaveTextContent('TARGET ACQUIRED: UTRECHT');
  });

  it('SLUIT WAR ROOM closes it', async () => {
    mockMotion(true);
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<WarRoom intel={intel} onClose={onClose} onPakFteBon={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /sluit war room/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('WarRoom — three steps from hype to action', () => {
  afterEach(() => vi.useRealTimers());

  it('1 situation → 2 pick a move → 3 assignment with impact and PAK FTE-BON', async () => {
    mockMotion(true);
    const user = userEvent.setup();
    const onPakFteBon = vi.fn();
    render(<WarRoom intel={intel} onClose={vi.fn()} onPakFteBon={onPakFteBon} />);

    const situation = screen.getByTestId('war-room-step-situation');
    expect(situation).toHaveTextContent('#10');
    expect(situation).toHaveTextContent('#9 Utrecht');
    expect(situation).toHaveTextContent('+0,19 FTE');
    expect(screen.getByRole('button', { name: /de situatie/i })).toHaveAttribute('aria-current', 'step');

    await user.click(screen.getByRole('button', { name: /kies mijn move/i }));
    const moves = within(screen.getByRole('group', { name: 'Kies je move' }));
    expect(moves.getAllByRole('button')).toHaveLength(4);

    await user.click(moves.getByRole('button', { name: /po → contract/i }));
    const assignment = screen.getByTestId('war-room-step-assignment');
    expect(assignment).toHaveTextContent(/jouw opdracht · po → contract/i);
    expect(within(assignment).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByTestId('war-room-impact')).toHaveTextContent('32 uur = +0,8 FTE. Nodig: +0,19 FTE voor #9 Utrecht, dat is 1 × deze move.');

    // Back to the moves through the stepper, then another move.
    await user.click(screen.getByRole('button', { name: /andere move/i }));
    await user.click(within(screen.getByRole('group', { name: 'Kies je move' })).getByRole('button', { name: /uren ophogen/i }));
    expect(screen.getByTestId('war-room-impact')).toHaveTextContent('Eén dag extra per week = +0,2 FTE');

    await user.click(screen.getByRole('button', { name: /pak fte-bon/i }));
    expect(onPakFteBon).toHaveBeenCalledTimes(1);
  });

  it('a verlenging is never sold as extra FTE', () => {
    expect(warRoomImpact('VERLENGEN', intel.nextTarget)).toMatch(/houdt fte vast/i);
    expect(warRoomImpact('NIEUW', null)).toMatch(/#1 in net fte/i);
  });
});
