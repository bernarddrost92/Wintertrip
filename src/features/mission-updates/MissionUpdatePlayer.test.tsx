import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MissionUpdatePlayer } from './MissionUpdatePlayer';
import { SoundtrackContext, type SoundtrackContextValue } from '../soundtrack/soundtrackContext';
import type { MissionUpdate } from '../../data/missionUpdates';

const UPDATE: MissionUpdate = {
  id: 'pak-september-mee',
  date: '2026-09-14',
  title: 'Pak september mee',
  videoSrc: '/mission-updates/mission-update-september.mp4',
  posterSrc: '/mission-updates/mission-update-september-poster.jpg',
};

function renderPlayer(soundtrackOverrides: Partial<SoundtrackContextValue> = {}, onClose = vi.fn()) {
  const value: SoundtrackContextValue = {
    isPlaying: false,
    isMuted: false,
    start: vi.fn(),
    togglePlay: vi.fn(),
    toggleMute: vi.fn(),
    pause: vi.fn(),
    ...soundtrackOverrides,
  };
  const utils = render(
    <SoundtrackContext.Provider value={value}>
      <MissionUpdatePlayer update={UPDATE} transmissionLabel="TRANSMISSION 001" onClose={onClose} />
    </SoundtrackContext.Provider>,
  );
  return { ...utils, soundtrack: value, onClose };
}

describe('MissionUpdatePlayer — opens with the video visible', () => {
  it('shows the mission update title, date and transmission label', () => {
    renderPlayer();
    expect(screen.getByText('Pak september mee')).toBeInTheDocument();
    expect(screen.getByText(/14 sep 2026/i)).toBeInTheDocument();
    expect(screen.getByText('TRANSMISSION 001')).toBeInTheDocument();
  });

  it('the video keeps a 9:16 aspect ratio class, never a landscape frame', () => {
    renderPlayer();
    const video = document.querySelector('video');
    expect(video?.className).toContain('aspect-[9/16]');
  });

  it('never autoplays — no autoplay attribute on the video element', () => {
    renderPlayer();
    const video = document.querySelector('video');
    expect(video?.autoplay).toBe(false);
  });

  it('lazy-loads: preload is "metadata", never "auto"/eager', () => {
    renderPlayer();
    const video = document.querySelector('video');
    expect(video?.getAttribute('preload')).toBe('metadata');
  });

  it('uses native HTML5 controls', () => {
    renderPlayer();
    const video = document.querySelector('video');
    expect(video?.hasAttribute('controls')).toBe(true);
  });
});

describe('MissionUpdatePlayer — closing', () => {
  it('the Close Transmission button calls onClose', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPlayer();
    await user.click(screen.getByRole('button', { name: /close transmission/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pressing Escape calls onClose', () => {
    const { onClose } = renderPlayer();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking the dark backdrop (not the video/panel) calls onClose', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPlayer();
    await user.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking the video itself never closes the player', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPlayer();
    const video = document.querySelector('video') as HTMLVideoElement;
    await user.click(video);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('MissionUpdatePlayer — global soundtrack coordination', () => {
  it('pauses the global soundtrack on open when it was playing', () => {
    const { soundtrack } = renderPlayer({ isPlaying: true });
    expect(soundtrack.pause).toHaveBeenCalledTimes(1);
  });

  it('never touches the soundtrack on open when it was already paused', () => {
    const { soundtrack } = renderPlayer({ isPlaying: false });
    expect(soundtrack.pause).not.toHaveBeenCalled();
  });

  it('resumes the global soundtrack after unmount, only if it was playing before opening', () => {
    const { unmount, soundtrack } = renderPlayer({ isPlaying: true });
    expect(soundtrack.start).not.toHaveBeenCalled();
    unmount();
    expect(soundtrack.start).toHaveBeenCalledTimes(1);
  });

  it('never resumes the soundtrack after unmount if it was not playing before opening', () => {
    const { unmount, soundtrack } = renderPlayer({ isPlaying: false });
    unmount();
    expect(soundtrack.start).not.toHaveBeenCalled();
  });
});
