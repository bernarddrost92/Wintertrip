import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, FileSignature, RefreshCw, TrendingUp, UserPlus, X } from 'lucide-react';
import { softAssetUrl } from '../../components/softAssets';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { formatSignedFte } from '../../utils/format';
import { GoldConfetti } from './GoldConfetti';
import type { HuntIntel } from './huntIntel';
import { warRoomLines } from './huntLines';
import { WAR_ROOM_MOVES, warRoomImpact, type WarRoomMoveKey } from './warRoomMoves';

/** How often the big line on the situation step changes. */
export const WAR_ROOM_LINE_MS = 2200;

const FOCUSABLE = 'button:not([disabled]), [href]';

const MOVE_ICONS: Record<WarRoomMoveKey, typeof RefreshCw> = {
  VERLENGEN: RefreshCw,
  PO_CONTRACT: FileSignature,
  NIEUW: UserPlus,
  UREN: TrendingUp,
};

const STEPS = [
  { label: 'De situatie', short: 'Situatie' },
  { label: 'Kies je move', short: 'Move' },
  { label: 'Jouw opdracht', short: 'Opdracht' },
] as const;
type Step = 0 | 1 | 2;

/** Where the flying lines start (percent of the viewport) — spread around
 * the centre so they never all pile up on the content. */
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
 * WAR ROOM — the over-the-top room inside Hunt Mode, now with a direction:
 * three steps from hype to action. 1 · the situation (live target, one big
 * line that keeps changing), 2 · pick one of the four moves, 3 · a concrete
 * assignment with three steps, what it brings toward the next target and
 * PAK FTE-BON. The madness — gold confetti, one-liners flying at you —
 * stays in the background. Its own small modal: Escape and SLUIT WAR ROOM
 * go back to the Hunt Room, focus stays inside. Reduced motion: no flying
 * lines and no confetti; everything else works.
 */
export function WarRoom({ intel, onClose, onPakFteBon }: WarRoomProps) {
  const reduced = usePrefersReducedMotion();
  const lines = useMemo(() => warRoomLines(intel), [intel]);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>(0);
  const [move, setMove] = useState<WarRoomMoveKey | null>(null);
  const [confetti, setConfetti] = useState(true);
  const [confettiKey, setConfettiKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const endConfetti = useCallback(() => setConfetti(false), []);
  const target = intel.nextTarget;
  const chosen = WAR_ROOM_MOVES.find((m) => m.key === move) ?? null;

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % lines.length), WAR_ROOM_LINE_MS);
    return () => window.clearInterval(timer);
  }, [lines.length]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  function goTo(next: Step) {
    setStep(next);
    contentRef.current?.scrollTo?.({ top: 0 });
  }

  function chooseMove(key: WarRoomMoveKey) {
    setMove(key);
    goTo(2);
    // Locking in a move earns a second burst.
    setConfettiKey((k) => k + 1);
    setConfetti(true);
  }

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
      {/* Mission-room backdrop: radar rings, a slow crosshair, gold scanlines
          and the flying one-liners — dimmed so the steps stay readable. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 60% at 50% 50%, rgba(214,174,85,0.16), transparent 70%)' }} />
        <img src={softAssetUrl('soft-crosshair')} alt="" className="absolute left-1/2 top-1/2 w-[110vmin] -translate-x-1/2 -translate-y-1/2 animate-radar-spin opacity-30" />
        <img src={softAssetUrl('soft-radar-corner')} alt="" className="absolute -right-32 -top-32 w-[760px] opacity-40" />
        <img src={softAssetUrl('soft-arc-bottom-left')} alt="" className="absolute -bottom-16 -left-32 w-[900px] opacity-40" />
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(214,174,85,0.05) 0px, rgba(214,174,85,0.05) 1px, transparent 1px, transparent 4px)' }} />
        <div className="absolute inset-x-0 top-0 h-px animate-hunt-scan bg-gradient-to-r from-transparent via-gold to-transparent" />
        {!reduced &&
          LANES.map((lane, i) => (
            <span
              key={i}
              className="absolute whitespace-nowrap font-display text-xl font-black uppercase tracking-[0.08em] text-gold-bright/45 animate-war-fly sm:text-4xl"
              style={{ left: `${lane.x}%`, top: `${lane.y}%`, animationDelay: `${i * 0.8}s` }}
            >
              {lines[(i * 3 + 1) % lines.length]}
            </span>
          ))}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(95% 80% at 50% 50%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0.85) 100%)' }} />
      </div>

      <div className="relative flex items-center justify-between gap-3 border-b border-gold/40 bg-black/70 px-4 py-3 sm:px-6">
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

      {/* Where you are: three steps from hype to action. */}
      <ol className="relative mx-auto mt-4 grid w-[min(720px,calc(100%-32px))] grid-cols-3 gap-px border border-gold/25 bg-gold/10" aria-label="War Room stappen">
        {STEPS.map(({ label, short }, i) => {
          const active = step === i;
          const reachable = i < step;
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!reachable && !active}
                aria-current={active ? 'step' : undefined}
                onClick={() => reachable && goTo(i as Step)}
                className={`flex min-h-11 w-full items-center justify-center gap-2 px-2 text-[13px] font-semibold transition-colors sm:text-sm ${
                  active ? 'bg-gold text-mission-deep' : reachable ? 'bg-black/70 text-gold hover:bg-gold/15' : 'bg-black/70 text-ink-muted/70'
                }`}
              >
                <span className="font-mono">{i + 1}</span>
                <span className={active ? 'sm:hidden' : 'hidden'}>{short}</span>
                <span className="hidden sm:inline">{label}</span>
                {reachable && <Check size={14} aria-hidden />}
              </button>
            </li>
          );
        })}
      </ol>

      <div ref={contentRef} className="relative flex flex-1 flex-col items-center overflow-y-auto px-4 pb-10 pt-8 text-center sm:justify-center sm:pt-6">
        <h2 id="war-room-title" className={step === 0 ? 'font-mono text-xs font-bold uppercase tracking-[0.5em] text-gold/90' : 'sr-only'}>
          War Room
        </h2>

        {step === 0 && (
          <div className="flex w-full max-w-5xl flex-col items-center" data-testid="war-room-step-situation">
            <p
              key={index}
              data-testid="war-room-line"
              aria-live="polite"
              className="mt-5 max-w-5xl animate-target-lock font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-7xl"
            >
              {lines[index]}
            </p>

            <dl className="mt-8 grid w-full max-w-3xl grid-cols-3 border border-gold/30 bg-black/60 text-left backdrop-blur-sm">
              <div className="border-r border-gold/20 p-3 sm:p-4">
                <dt className="text-[12px] font-medium text-ink-muted sm:text-[13px]">Wij · Net FTE</dt>
                <dd className="mt-1 font-display text-2xl font-black text-gold-bright sm:text-4xl">#{intel.netFteRank}</dd>
              </div>
              <div className="border-r border-gold/20 p-3 sm:p-4">
                <dt className="text-[12px] font-medium text-ink-muted sm:text-[13px]">Target</dt>
                <dd className="mt-1 font-display text-2xl font-black text-ink sm:text-4xl">{target ? `#${target.rank} ${target.team}` : 'Net FTE #1'}</dd>
              </div>
              <div className="p-3 sm:p-4">
                <dt className="text-[12px] font-medium text-ink-muted sm:text-[13px]">Nodig</dt>
                <dd className="mt-1 font-display text-2xl font-black text-gold-bright sm:text-4xl">{target ? `${formatSignedFte(target.fteNeeded)} FTE` : 'Vasthouden'}</dd>
              </div>
            </dl>

            <p className="mt-6 max-w-xl text-base leading-snug text-ink-muted">Genoeg hype. In twee klikken heb je je opdracht voor vandaag.</p>
            <button
              type="button"
              onClick={() => goTo(1)}
              className="mt-6 inline-flex min-h-14 items-center gap-3 bg-gold px-8 font-display text-lg font-black uppercase tracking-[0.1em] text-mission-deep transition-colors hover:bg-gold-bright sm:text-xl"
            >
              Kies mijn move
              <ArrowRight size={20} aria-hidden />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="flex w-full max-w-4xl flex-col items-center" data-testid="war-room-step-moves">
            <p className="mt-5 font-display text-4xl font-black uppercase leading-none tracking-tight text-ink sm:text-6xl">Kies je move</p>
            <p className="mt-3 text-base text-ink-muted">Welke move kun jij deze week maken? Net FTE = BPT + VD, PO telt niet mee.</p>
            <div className="mt-7 grid w-full gap-3 sm:grid-cols-2" role="group" aria-label="Kies je move">
              {WAR_ROOM_MOVES.map((m, i) => {
                const Icon = MOVE_ICONS[m.key];
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => chooseMove(m.key)}
                    className="group flex min-h-[88px] items-center gap-4 border border-gold/35 bg-black/70 p-4 text-left backdrop-blur-sm transition-colors hover:border-gold hover:bg-gold/10 focus-visible:border-gold"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-gold/40 text-gold group-hover:bg-gold group-hover:text-mission-deep" aria-hidden>
                      <Icon size={22} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[12px] text-gold/80">0{i + 1}</span>
                      <span className="block font-display text-2xl font-black uppercase leading-tight text-ink">{m.label}</span>
                      <span className="block text-sm text-ink-muted">{m.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => goTo(0)} className="mt-5 inline-flex min-h-11 items-center gap-2 px-3 text-sm text-ink-muted hover:text-ink">
              <ArrowLeft size={15} aria-hidden /> Terug
            </button>
          </div>
        )}

        {step === 2 && chosen && (
          <div className="flex w-full max-w-3xl flex-col items-center" data-testid="war-room-step-assignment">
            <p className="mt-5 font-mono text-[12px] font-bold uppercase tracking-[0.3em] text-gold">Jouw opdracht · {chosen.label}</p>
            <p className="mt-3 animate-target-lock font-display text-2xl font-black uppercase leading-[1.05] tracking-tight text-ink sm:text-4xl">{chosen.assignment}</p>

            <ol className="mt-7 w-full space-y-2 text-left">
              {chosen.steps.map((s, i) => (
                <li key={s} className="flex items-start gap-3 border border-white/10 bg-black/65 px-4 py-3 backdrop-blur-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-gold font-mono text-sm font-bold text-mission-deep">{i + 1}</span>
                  <span className="pt-0.5 text-base text-ink">{s}</span>
                </li>
              ))}
            </ol>

            <p className="mt-4 w-full border-l-2 border-gold bg-gold/10 px-4 py-3 text-left text-[15px] text-ink" data-testid="war-room-impact">
              {warRoomImpact(chosen.key, target)}
            </p>

            <div className="mt-7 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={onPakFteBon}
                className="inline-flex min-h-14 w-full items-center justify-center gap-3 bg-gold px-8 font-display text-lg font-black uppercase tracking-[0.1em] text-mission-deep transition-colors hover:bg-gold-bright sm:w-auto sm:text-xl"
              >
                <span className="hidden sm:inline">Move gemaakt?</span> Pak FTE-bon
                <ArrowRight size={20} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => goTo(1)}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-gold/45 px-5 text-sm font-semibold text-gold hover:bg-gold/10 sm:w-auto"
              >
                <ArrowLeft size={15} aria-hidden /> Andere move
              </button>
            </div>
          </div>
        )}
      </div>

      {confetti && !reduced && <GoldConfetti key={confettiKey} onDone={endConfetti} />}
    </div>
  );
}
