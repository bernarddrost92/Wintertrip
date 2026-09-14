import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { formatIsoDateReceipt } from '../../utils/dates';
import { useSoundtrack } from '../soundtrack/soundtrackContext';
import type { MissionUpdate } from '../../data/missionUpdates';

interface MissionUpdatePlayerProps {
  update: MissionUpdate;
  transmissionLabel: string;
  onClose: () => void;
}

/**
 * Immersive dark player overlay for one Mission Update. The video is
 * always 9:16 portrait — the frame is sized by aspect-ratio, never
 * stretched to landscape, and never cropped: on desktop it's centered and
 * capped to the viewport height; on mobile it fills the width with no
 * horizontal overflow.
 *
 * Audio coordination (the one place this feature is allowed to touch the
 * existing soundtrack player): the video carries its own soundtrack, so the
 * global 007 theme is paused for as long as this overlay is open, and only
 * resumed afterwards if it was actually playing before — never started
 * from nothing.
 */
export function MissionUpdatePlayer({ update, transmissionLabel, onClose }: MissionUpdatePlayerProps) {
  const { isPlaying, pause, start } = useSoundtrack();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasPlayingOnOpen = useRef(isPlaying);

  useEffect(() => {
    if (wasPlayingOnOpen.current) pause();
    closeButtonRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (wasPlayingOnOpen.current) start();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Mission Update — ${update.title}`}
      className="fixed inset-0 z-50 flex flex-col bg-mission-void/97 backdrop-blur-md animate-[intro-quickfade_0.15s_ease-out_both]"
      onClick={handleBackdropClick}
    >
      <div className="flex items-start justify-between gap-4 border-b border-gold/15 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="label-classified text-gold/70">
            Mission Update <span className="text-ink-muted">· {formatIsoDateReceipt(update.date)}</span>
          </p>
          <p className="mt-1 truncate font-display text-lg font-bold uppercase tracking-wide text-ink sm:text-xl">{update.title}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-gold/60">{transmissionLabel}</p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="flex shrink-0 items-center gap-1.5 border border-gold/30 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gold transition-colors duration-150 hover:border-gold hover:bg-gold/10"
        >
          <X size={13} aria-hidden />
          <span className="hidden sm:inline">Close Transmission</span>
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-3 py-4 sm:px-6 sm:py-6">
        {/* aspect-[9/16] is the one thing sizing this box — height-capped on
            desktop (tall viewport), width-capped on mobile (narrow
            viewport), but the ratio itself never changes either way. */}
        <video
          key={update.id}
          controls
          playsInline
          preload="metadata"
          poster={update.posterSrc}
          className="aspect-[9/16] max-h-full max-w-full bg-black shadow-gold-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <source src={update.videoSrc} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
