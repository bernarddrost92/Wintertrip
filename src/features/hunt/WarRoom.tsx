import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { softAssetUrl } from '../../components/softAssets';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { GoldConfetti } from './GoldConfetti';
import type { HuntIntel } from './huntIntel';
import { warRoomLines } from './huntLines';

/** How often the big centre line changes. */
export const WAR_ROOM_LINE_MS = 2200;

const FOCUSABLE = 'button:not([disabled]), [href]';

/** Where the flying lines start (percent of the viewport) — spread around
 * the centre so they never all pile up on the headline. */
const LANES = [
  { x: 24, y: 22 },
  { x: 76, y: 30 },
  { x: 30, y: 74 },
  { x: 72, y: 70 },
  { x: 50, y: 14 },
  { x: 16, y: 50 },
  { x: 84, y: 52 },
  { x: 50, y: 86 },
];

interface WarRoomProps {
  intel: HuntIntel;
  onClose: () => void;
  onPakFteBon: () => void;
}

/**
 * WAR ROOM — the over-the-top motivation room inside Hunt Mode. Opens with
 * a gold confetti burst; one-liners fly at the viewer from eight lanes
 * (pure CSS transform/opacity, only while it is open), one big line in the
 * centre locks in and changes every ~2s. Its own small modal: Escape and
 * SLUIT WAR ROOM go back to the Hunt Room, focus stays inside. With
 * reduced motion the flying lines are left out and only the centre line
 * changes.
 */
export function WarRoom({ intel, onClose, onPakFteBon }: WarRoomProps) {
  const reduced = usePrefersReducedMotion();
  const lines = useMemo(() => warRoomLines(intel), [intel]);
  const [index, setIndex] = useState(0);
  const [confetti, setConfetti] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const endConfetti = useCallback(() => setConfetti(false), []);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % lines.length), WAR_ROOM_LINE_MS);
    return () => window.clearInterval(timer);
  }, [lines.length]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Never let Escape/Tab reach the Hunt overlay underneath.
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !rootRef.current) return;
    event.stopPropagation();
    const focusables = Array.from(rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="war-room-title"
      onKeyDown={handleKeyDown}
      data-testid="war-room"
      className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-black text-ink animate-[intro-quickfade_0.35s_ease-out_both]"
    >
      {/* Mission-room backdrop: radar rings, a slow crosshair, gold scanlines. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 60% at 50% 50%, rgba(214,174,85,0.16), transparent 70%)' }} />
        <img src={softAssetUrl('soft-crosshair')} alt="" className="absolute left-1/2 top-1/2 w-[110vmin] -translate-x-1/2 -translate-y-1/2 animate-radar-spin opacity-40" />
        <img src={softAssetUrl('soft-radar-corner')} alt="" className="absolute -right-32 -top-32 w-[760px] opacity-50" />
        <img src={softAssetUrl('soft-arc-bottom-left')} alt="" className="absolute -bottom-16 -left-32 w-[900px] opacity-50" />
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(214,174,85,0.05) 0px, rgba(214,174,85,0.05) 1px, transparent 1px, transparent 4px)' }} />
        <div className="absolute inset-x-0 top-0 h-px animate-hunt-scan bg-gradient-to-r from-transparent via-gold to-transparent" />
        {!reduced &&
          LANES.map((lane, i) => (
            <span
              key={i}
              className="absolute whitespace-nowrap font-display text-xl font-black uppercase tracking-[0.08em] text-gold-bright/80 animate-war-fly sm:text-4xl"
              style={{ left: `${lane.x}%`, top: `${lane.y}%`, animationDelay: `${i * 0.8}s` }}
            >
              {lines[(i * 3 + 1) % lines.length]}
            </span>
          ))}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(95% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.75) 100%)' }} />
      </div>

      <div className="relative flex items-center justify-between gap-3 border-b border-gold/40 bg-black/60 px-4 py-3 sm:px-6">
        <p className="truncate font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-gold">
          War Room<span className="hidden sm:inline"> · Team Zwolle</span>
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-gold/50 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/15"
        >
          <X size={14} aria-hidden />
          Sluit War Room
        </button>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h2 id="war-room-title" className="font-mono text-xs font-bold uppercase tracking-[0.5em] text-gold/90">
          War Room
        </h2>
        <p
          key={index}
          data-testid="war-room-line"
          aria-live="polite"
          className="mt-6 max-w-5xl animate-target-lock font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-ink sm:text-7xl lg:text-8xl"
        >
          {lines[index]}
        </p>
        <button
          type="button"
          onClick={onPakFteBon}
          className="mt-10 inline-flex items-center gap-3 bg-gold px-8 py-4 font-display text-xl font-black uppercase tracking-[0.12em] text-mission-deep transition-colors hover:bg-gold-bright sm:text-2xl"
        >
          Pak FTE-bon
          <ArrowRight size={22} aria-hidden />
        </button>
      </div>

      {confetti && <GoldConfetti onDone={endConfetti} />}
    </div>
  );
}
