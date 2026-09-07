import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useSoundtrack } from './soundtrackContext';
import { SoundtrackProvider } from './SoundtrackProvider';

function TestConsumer() {
  const { isPlaying, start } = useSoundtrack();
  return (
    <div>
      <p>status: {isPlaying ? 'playing' : 'off'}</p>
      <button type="button" onClick={start}>
        Accept Mission
      </button>
    </div>
  );
}

describe('SoundtrackProvider (audio start is tied to a real user gesture)', () => {
  it('never plays before any interaction', () => {
    render(
      <SoundtrackProvider>
        <TestConsumer />
      </SoundtrackProvider>,
    );
    const audio = document.querySelector('audio') as HTMLAudioElement;
    expect(audio.play).not.toHaveBeenCalled();
    expect(screen.getByText('status: off')).toBeInTheDocument();
  });

  it('starts playback synchronously inside the click that accepts the mission', async () => {
    const user = userEvent.setup();
    render(
      <SoundtrackProvider>
        <TestConsumer />
      </SoundtrackProvider>,
    );

    const audio = document.querySelector('audio') as HTMLAudioElement;
    await user.click(screen.getByRole('button', { name: 'Accept Mission' }));

    expect(audio.play).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText('status: playing')).toBeInTheDocument());
  });
});
