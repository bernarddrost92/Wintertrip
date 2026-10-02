import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MissionUpdatesPage } from './MissionUpdatesPage';
import { SoundtrackContext, type SoundtrackContextValue } from '../soundtrack/soundtrackContext';

const NOOP_SOUNDTRACK: SoundtrackContextValue = {
  isPlaying: false,
  isMuted: false,
  start: () => {},
  togglePlay: () => {},
  toggleMute: () => {},
  pause: () => {},
};

function renderPage() {
  return render(
    <SoundtrackContext.Provider value={NOOP_SOUNDTRACK}>
      <MissionUpdatesPage />
    </SoundtrackContext.Provider>,
  );
}

describe('MissionUpdatesPage — page header', () => {
  it('shows the 007 mission-archive header', () => {
    renderPage();
    expect(screen.getByText(/007 · mission archive/i)).toBeInTheDocument();
    expect(screen.getByText('Mission Updates')).toBeInTheDocument();
    expect(screen.getByText(/classified communications/i)).toBeInTheDocument();
    expect(screen.getByText(/team zwolle/i)).toBeInTheDocument();
  });
});

describe('MissionUpdatesPage — Latest Transmission uses the newest date', () => {
  it("shows the catalog's newest update as Latest Transmission, regardless of array order", () => {
    renderPage();
    expect(screen.getByText(/latest transmission/i)).toBeInTheDocument();
    expect(screen.getByText('Stoptober')).toBeInTheDocument();
    expect(screen.getByText(/01 okt 2026/i)).toBeInTheDocument();
  });

  it('an image transmission shows a VIEW TRANSMISSION call to action', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /^view transmission$/i })).toBeInTheDocument();
  });
});

describe('MissionUpdatesPage — Mission Archive', () => {
  it('logs the older September video in the archive, numbered from the oldest', () => {
    renderPage();
    expect(screen.queryByText(/no additional transmissions logged/i)).not.toBeInTheDocument();
    expect(screen.getByText('Pak september mee')).toBeInTheDocument();
    expect(screen.getByText('TRANSMISSION 001')).toBeInTheDocument();
  });
});

describe('MissionUpdatesPage — opening/closing the player', () => {
  it('clicking VIEW TRANSMISSION opens the player with the image visible', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /^view transmission$/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Stoptober' })).toBeInTheDocument();
    expect(document.querySelector('video')).not.toBeInTheDocument();
  });

  it('opening an archived video transmission shows the video', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Pak september mee'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  it('closing the player removes it from the document', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /^view transmission$/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close transmission/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
