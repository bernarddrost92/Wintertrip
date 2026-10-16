import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ArrowRight, Crosshair, X } from 'lucide-react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import type { NetFteTarget } from '../../services/netFteProjection';
import { formatSignedFte } from '../../utils/format';
import { pickDifferent } from '../hunt/huntLines';
import { HuntRangeHitMessage } from './HuntRangeHitMessage';
import { HuntRangeResult } from './HuntRangeResult';
import { HuntRangeTarget, type RangeTargetMode } from './HuntRangeTarget';
import { RANGE_HIT_LINES, RANGE_ROUND_SIZE, buildRound, fillHitLine, type RangeHitLine } from './huntRangeLines';
import './huntRange.css';

/** How long a hit one-liner stays up. */
export const RANGE_MESSAGE_MS = 2800;
/** The pause after the last target before the result shows. */
export const RANGE_END_MS = 800;

const FOCUSABLE = 'button:not([disabled]), [href]';
const NARROW_QUERY = '(max-width: 639px)';

type Phase = 'briefing' | 'playing' | 'result';
type Status = 'active' | 'hit' | 'missed' | 'done';
interface Spawn {
  lane: number;
  mode: RangeTargetMode;
  durationMs: number;
  popX: number;
}

function useIsNarrow(): boolean {
  const [narrow] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(NARROW_QUERY).matches);
  return narrow;
}

interface HuntRangeProps {
  /** The vestigingen above Zwolle in Net FTE, nearest first (getRangeTargets). */
  targets: NetFteTarget[];
  onClose: () => void;
  onPakFteBon: () => void;
  /** Injectable for tests. */
  random?: () => number;
}

/**
 * HUNT RANGE — a short, fun-only shooting range inside Hunt Mode. Black
 * cardboard training targets carrying the vestigingen above Zwolle in Net
 * FTE slide along the rail or pop up; five per round, two lanes on desktop,
 * one on mobile, a static board with reduced motion. Every hit shows a
 * one-liner plus the real FTE still needed — and the result always ends on
 * FTE VERDIEND 0,00: the score is never stored and changes nothing. Its own
 * small modal on top of Hunt Mode: Escape and SLUIT go back to the Hunt Room.
 */
export function HuntRange({ targets: liveTargets, onClose, onPakFteBon, random = Math.random }: HuntRangeProps) {
  const reduced = usePrefersReducedMotion();
  const narrow = useIsNarrow();
  const laneCount = narrow ? 1 : 2;
  // The standings as they were when the range opened: a re-render of Hunt
  // Mode underneath never reshuffles a round in progress.
  const [targets] = useState(liveTargets);
  const round = useMemo(() => buildRound(targets), [targets]);

  const [phase, setPhase] = useState<Phase>('briefing');
  const [roundKey, setRoundKey] = useState(0);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [spawns, setSpawns] = useState<Record<string, Spawn>>({});
  const [hits, setHits] = useState(0);
  const [message, setMessage] = useState<{ line: RangeHitLine; target: NetFteTarget; key: number } | null>(null);
  const [tap, setTap] = useState<{ x: number; y: number; key: number } | null>(null);
  const lastLine = useRef<RangeHitLine | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  const startRound = useCallback(() => {
    setStatus({});
    setSpawns({});
    setHits(0);
    setMessage(null);
    setRoundKey((k) => k + 1);
    setPhase('playing');
    if (reduced) {
      // Static target board: everything up at once, nothing moves.
      setSpawns(Object.fromEntries(round.map((a, i) => [a.id, { lane: i, mode: 'board' as const, durationMs: 0, popX: 0 }])));
      setStatus(Object.fromEntries(round.map((a) => [a.id, 'active' as const])));
    }
  }, [reduced, round]);

  // The spawner: whenever a lane is free, the next target enters after a
  // lightly randomised pause. When every target is down or gone, the round ends.
  useEffect(() => {
    if (phase !== 'playing') return;
    const busy = round.filter((a) => status[a.id] === 'active' || status[a.id] === 'hit');
    const pending = round.find((a) => !(a.id in status));
    if (!pending) {
      if (busy.length > 0) return;
      const timer = window.setTimeout(() => setPhase('result'), RANGE_END_MS);
      return () => window.clearTimeout(timer);
    }
    if (busy.length >= laneCount) return;
    const usedLanes = new Set(busy.map((a) => spawns[a.id]?.lane));
    const lane = [...Array(laneCount).keys()].find((l) => !usedLanes.has(l)) ?? 0;
    const first = Object.keys(status).length === 0;
    const gap = first ? 450 : 500 + random() * 900;
    const timer = window.setTimeout(() => {
      const popup = random() < 0.3;
      const spawn: Spawn = popup
        ? { lane, mode: 'popup', durationMs: Math.round(3000 + random() * 800 + (narrow ? 400 : 0)), popX: Math.round(8 + random() * 62) }
        : { lane, mode: random() < 0.5 ? 'slide-ltr' : 'slide-rtl', durationMs: Math.round((narrow ? 5200 : 4400) + random() * 1400), popX: 0 };
      setSpawns((s) => ({ ...s, [pending.id]: spawn }));
      setStatus((s) => ({ ...s, [pending.id]: 'active' }));
    }, gap);
    return () => window.clearTimeout(timer);
  }, [phase, status, spawns, round, laneCount, narrow, random]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), RANGE_MESSAGE_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!tap) return;
    const timer = window.setTimeout(() => setTap(null), 450);
    return () => window.clearTimeout(timer);
  }, [tap]);

  const handleHit = useCallback(
    (id: string) => {
      const appearance = round.find((a) => a.id === id);
      if (!appearance) return;
      setStatus((s) => (s[id] === 'active' ? { ...s, [id]: 'hit' } : s));
      setHits((h) => h + 1);
      const line = pickDifferent(RANGE_HIT_LINES, lastLine.current, random);
      lastLine.current = line;
      setMessage({ line: fillHitLine(line, appearance.target), target: appearance.target, key: Date.now() });
    },
    [round, random],
  );
  const handleMiss = useCallback((id: string) => setStatus((s) => (s[id] === 'active' ? { ...s, [id]: 'missed' } : s)), []);
  const handleCleared = useCallback((id: string) => setStatus((s) => (s[id] === 'hit' ? { ...s, [id]: 'done' } : s)), []);

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
    if (focusables.length === 0) return;
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

  function handleStagePointer(event: PointerEvent<HTMLDivElement>) {
    // Touch has no cursor: show the crosshair where the finger lands.
    if (event.pointerType !== 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTap({ x: event.clientX - rect.left, y: event.clientY - rect.top, key: Date.now() });
  }

  const appeared = round.filter((a) => a.id in status).length;
  const nextTarget = targets[0] ?? null;
  const live = round.filter((a) => status[a.id] === 'active' || status[a.id] === 'hit');

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hunt-range-title"
      onKeyDown={handleKeyDown}
      data-testid="hunt-range"
      data-reduced={reduced || undefined}
      className="hr-root fixed inset-0 z-[90] flex flex-col overflow-hidden text-ink"
    >
      <div className="hr-scene" aria-hidden>
        <div className="hr-ceiling" />
        <div className="hr-spot hr-spot-a" />
        <div className="hr-spot hr-spot-b" />
        <div className="hr-spot hr-spot-c" />
        <div className="hr-haze" />
        <div className="hr-floor" />
        <span className="hr-hud hr-hud-tl" />
        <span className="hr-hud hr-hud-tr" />
        <span className="hr-hud hr-hud-bl" />
        <span className="hr-hud hr-hud-br" />
      </div>

      <div className="hr-bar">
        <p className="hr-bar-title">
          <Crosshair size={14} aria-hidden />
          <span id="hunt-range-title">Hunt Range</span>
          <span className="hidden sm:inline">· Team Zwolle</span>
        </p>
        {phase === 'playing' && (
          <p className="hr-bar-hud" data-testid="range-hud">
            Target {appeared}/{round.length} · Hits {hits}
          </p>
        )}
        <button ref={closeRef} type="button" onClick={onClose} className="hr-bar-close">
          <X size={14} aria-hidden />
          Sluit<span className="hidden sm:inline"> Hunt Range</span>
        </button>
      </div>

      {targets.length === 0 ? (
        <div className="hr-center" data-testid="range-no-targets">
          <p className="hr-kicker">Net FTE #1</p>
          <h2 className="hr-title">No targets remaining</h2>
          <p className="hr-title-sub">Defend the position.</p>
          <p className="hr-copy">Er staat niemand meer boven Zwolle in Net FTE. Vasthouden doe je met bonnen.</p>
          <div className="hr-actions">
            <button type="button" onClick={onPakFteBon} className="hunt3-button hunt3-button-primary">
              Pak FTE-bon <ArrowRight size={17} aria-hidden />
            </button>
            <button type="button" onClick={onClose} className="hunt3-button hunt3-button-secondary">
              Terug naar Hunt Room
            </button>
          </div>
        </div>
      ) : phase === 'briefing' ? (
        <div className="hr-center" data-testid="range-briefing">
          <p className="hr-kicker">Training range · {RANGE_ROUND_SIZE} targets</p>
          <h2 className="hr-title">Hunt Range</h2>
          {nextTarget && (
            <p className="hr-briefing-target">
              Next target: <strong>{nextTarget.team.toUpperCase()} #{nextTarget.rank}</strong>
              <span className="hr-gold"> · {formatSignedFte(nextTarget.fteNeeded)} FTE nodig</span>
            </p>
          )}
          <p className="hr-copy">Raak de kartonnen vestigingen boven Zwolle in Net FTE. Levert gegarandeerd 0,00 FTE op.</p>
          <div className="hr-actions">
            <button type="button" onClick={startRound} className="hunt3-button hunt3-button-primary">
              <Crosshair size={16} aria-hidden /> Start ronde
            </button>
            <button type="button" onClick={onClose} className="hunt3-button hunt3-button-secondary">
              Terug naar Hunt Room
            </button>
          </div>
        </div>
      ) : phase === 'playing' ? (
        <div key={roundKey} className={`hr-stage ${reduced ? 'hr-stage-board' : ''}`} onPointerDown={handleStagePointer} data-testid="range-stage">
          {reduced ? (
            <div className="hr-board">
              {round.map((a) =>
                status[a.id] === 'active' || status[a.id] === 'hit' ? (
                  <HuntRangeTarget key={a.id} appearance={a} hit={status[a.id] === 'hit'} mode="board" durationMs={0} popX={0} onHit={handleHit} onMiss={handleMiss} onCleared={handleCleared} />
                ) : (
                  <div key={a.id} className="hr-board-empty" aria-hidden />
                ),
              )}
            </div>
          ) : (
            [...Array(laneCount).keys()].map((lane) => (
              <div key={lane} className="hr-lane">
                <div className="hr-rail" aria-hidden />
                {live
                  .filter((a) => spawns[a.id]?.lane === lane)
                  .map((a) => (
                    <HuntRangeTarget
                      key={a.id}
                      appearance={a}
                      hit={status[a.id] === 'hit'}
                      mode={spawns[a.id].mode}
                      durationMs={spawns[a.id].durationMs}
                      popX={spawns[a.id].popX}
                      onHit={handleHit}
                      onMiss={handleMiss}
                      onCleared={handleCleared}
                    />
                  ))}
              </div>
            ))
          )}
          {tap && <span key={tap.key} className="hr-tap" style={{ left: tap.x, top: tap.y }} aria-hidden />}
          {message && <HuntRangeHitMessage key={message.key} line={message.line} target={message.target} />}
        </div>
      ) : (
        <div className="hr-center">
          <HuntRangeResult hits={hits} total={round.length} onPakFteBon={onPakFteBon} onAgain={startRound} onBack={onClose} random={random} />
        </div>
      )}
    </div>
  );
}
