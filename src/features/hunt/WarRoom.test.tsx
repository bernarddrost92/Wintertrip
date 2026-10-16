import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { getHuntIntel } from './huntIntel';
import { WAR_ROOM_LINES, warRoomLines } from './huntLines';
import { HUNT_TEST_STANDINGS } from './huntTestStandings';
import { WAR_ROOM_LINE_MS, WarRoom } from './WarRoom';

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
