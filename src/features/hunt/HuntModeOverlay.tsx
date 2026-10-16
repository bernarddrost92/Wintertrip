import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowRight, Crosshair, Dices, FileSignature, RefreshCw, UserPlus, ArrowUpRight, X, Zap } from 'lucide-react';
import { ControlRoomEnvironment } from '../../components/ControlRoomEnvironment';
import { HudCorners } from '../../components/HudCorners';
import { StatusLed } from '../../components/MissionSerial';
import { softAssetUrl } from '../../components/softAssets';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { useFteBonnen } from '../../hooks/useFteBonnen';
import { getMissionSnapshot } from '../../services/missionSnapshot';
import { formatFactor, formatSignedFte, formatVcdbValue } from '../../utils/format';
import { formatPowerBiTime } from '../../utils/snapshotTime';
import { getHuntIntel, type HuntIntel } from './huntIntel';
import { HUNT_MISSIONS, HUNT_ONE_LINERS, pickDifferent } from './huntLines';

/** How long the mission intro stands before the Hunt Room opens. */
export const HUNT_INTRO_MS = 1400;

const MOVES = [
  { code: '01', label: 'Verlengen', icon: RefreshCw },
  { code: '02', label: 'PO → contract', icon: FileSignature },
  { code: '03', label: 'Nieuwe contractant', icon: UserPlus },
  { code: '04', label: 'Uren ophogen', icon: ArrowUpRight },
];

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface HuntModeOverlayProps {
  /** Show the "HUNT IS ON" intro first — only on a deliberate activation. */
  showIntro: boolean;
  onExit: () => void;
  /** Closes Hunt Mode and opens the existing FTE Bon Calculator. */
  onPakFteBon: () => void;
  /** Injectable for tests. */
  random?: () => number;
}

/** Moving HUD layer on top of the cinematic control room — supplied assets
 * only, transform/opacity animation only, lighter on mobile. */
function HuntHud() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-black/45" />
      <div
        className="absolute -inset-x-0 -top-16 bottom-0 animate-hunt-grid-drift opacity-60"
        style={{ backgroundImage: `url("${softAssetUrl('soft-grid')}")`, backgroundSize: '64px 64px' }}
      />
      <img src={softAssetUrl('soft-radar-corner')} alt="" className="absolute -right-24 -top-24 w-[640px] opacity-40 sm:w-[900px] sm:opacity-50" />
      <img src={softAssetUrl('soft-arc-bottom-left')} alt="" className="absolute -bottom-10 -left-24 w-[700px] opacity-40 sm:w-[1000px]" />
      <img
        src={softAssetUrl('soft-crosshair')}
        alt=""
        className="absolute left-1/2 top-[42%] hidden w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-30 lg:block"
      />
      <div className="absolute inset-x-0 top-0 hidden h-px animate-hunt-scan bg-gradient-to-r from-transparent via-gold/70 to-transparent sm:block" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(90% 70% at 50% 40%, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
    </div>
  );
}

function HuntIntro({ intel, onSkip }: { intel: HuntIntel; onSkip: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col items-center justify-center px-4 py-12 text-center">
      <p className="animate-hunt-rise font-mono text-xs font-bold uppercase tracking-[0.4em] text-gold/80">Team Zwolle // Classified</p>
      <h2 id="hunt-title" className="mt-6 animate-hunt-rise font-display text-6xl font-black uppercase leading-[0.88] tracking-tight text-ink [animation-delay:120ms] sm:text-8xl lg:text-9xl">
        The Net FTE
        <br />
        <span className="bg-gold-sweep bg-[length:200%_auto] bg-clip-text text-transparent animate-gold-sweep-move">Hunt is on</span>
      </h2>
      <div className="mt-8 flex animate-hunt-rise items-center gap-4 font-display text-2xl font-black uppercase tracking-wide [animation-delay:260ms] sm:text-4xl">
        <span className="text-ink">VCDB #{intel.vcdbRank}</span>
        <span className="h-8 w-px bg-gold/50" aria-hidden />
        <span className="text-gold">Net FTE #{intel.netFteRank}</span>
      </div>
      <p className="mt-6 animate-hunt-rise font-display text-lg font-bold uppercase tracking-[0.2em] text-ink-muted [animation-delay:380ms] sm:text-2xl">
        De voorsprong is er. <span className="text-gold">Nu verzilveren.</span>
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="mt-10 inline-flex items-center gap-2 border border-gold/40 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/10"
      >
        Intro overslaan
        <ArrowRight size={13} aria-hidden />
      </button>
    </div>
  );
}

function HuntBlock({ kicker, children, sub, accent = false, className = '' }: { kicker: string; children: ReactNode; sub: ReactNode; accent?: boolean; className?: string }) {
  return (
    <div
      role="group"
      aria-label={kicker}
      className={`relative overflow-hidden border px-4 py-5 backdrop-blur-sm sm:px-8 sm:py-9 ${
        accent ? 'border-gold/70 bg-gold/[0.08] shadow-gold-lg' : 'border-gold/25 bg-black/40'
      } ${className}`}
    >
      {accent && <HudCorners />}
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-gold/80">{kicker}</p>
      <div className="mt-3">{children}</div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted sm:text-sm">{sub}</div>
    </div>
  );
}

function HuntRoom({ intel, officialDate, openCount, random, onPakFteBon }: { intel: HuntIntel; officialDate: string; openCount: number; random: () => number; onPakFteBon: () => void }) {
  const [line, setLine] = useState(() => pickDifferent(HUNT_ONE_LINERS, null, random));
  const [lineLock, setLineLock] = useState(0);
  const [mission, setMission] = useState<string | null>(null);
  const [missionLock, setMissionLock] = useState(0);
  const target = intel.nextTarget;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-6 sm:space-y-10 sm:px-6 sm:pt-10">
      <header className="animate-hunt-rise text-center">
        <p className="flex items-center justify-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-gold/80">
          <StatusLed tone="go" /> Live · Power BI {officialDate}
        </p>
        <h2 id="hunt-title" className="mt-3 font-display text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl lg:text-8xl">
          <span className="bg-gold-sweep bg-[length:200%_auto] bg-clip-text text-transparent animate-gold-sweep-move">The FTE Hunt is on</span>
        </h2>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <HuntBlock kicker="A · Onze kracht" sub="De voorsprong is binnen.">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-ink-muted">VCDB</p>
          <p className="font-display text-6xl font-black leading-none tabular-nums text-ink sm:text-8xl">#{intel.vcdbRank}</p>
        </HuntBlock>
        <HuntBlock kicker="B · De missie" sub="Hier ligt onze hefboom.">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-ink-muted">Net FTE</p>
          <p className="font-display text-6xl font-black leading-none tabular-nums text-gold sm:text-8xl">#{intel.netFteRank}</p>
        </HuntBlock>
        <HuntBlock
          kicker="C · Next target"
          accent
          className="col-span-2 lg:col-span-1"
          sub={target ? (intel.openFte !== 0 ? 'Vanaf de projectie incl. open bonnen' : 'Vanaf de officiële stand') : 'Niemand meer boven ons'}
        >
          <div data-testid="hunt-next-target" className="animate-target-lock">
            {target ? (
              <>
                <p className="flex items-center gap-3 font-display text-3xl font-black uppercase leading-tight text-ink sm:text-4xl">
                  <span className="relative flex h-3 w-3 shrink-0" aria-hidden>
                    <span className="absolute inset-0 animate-hunt-ping rounded-full bg-gold" />
                    <span className="relative h-3 w-3 rounded-full bg-gold" />
                  </span>
                  #{target.rank} {target.team}
                </p>
                <p className="mt-3 font-display text-5xl font-black leading-none tabular-nums text-gold sm:text-6xl lg:text-5xl">
                  <span className="whitespace-nowrap">{formatSignedFte(target.fteNeeded)} FTE</span> <span className="mt-1 block text-xl uppercase tracking-[0.2em] text-gold-bright/80 sm:text-2xl">nodig</span>
                </p>
              </>
            ) : (
              <p className="font-display text-4xl font-black uppercase text-gold">#1 in Net FTE — vasthouden</p>
            )}
          </div>
        </HuntBlock>
      </div>

      <dl className="grid grid-cols-2 gap-px border border-gold/25 bg-gold/20 sm:grid-cols-4">
        {[
          { label: 'Factor', value: formatFactor(intel.factor) },
          { label: 'Eindstand', value: `#${intel.finalPosition}` },
          { label: 'Open FTE-bonnen', value: `${formatSignedFte(intel.openFte)}`, sub: `${openCount} open` },
          { label: 'Projectie FTE-rank', value: `#${intel.projectedNetFteRank}`, sub: formatVcdbValue(intel.projectedNetFte), intel: true },
        ].map((item) => (
          <div key={item.label} className="bg-black/70 px-4 py-4">
            <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-gold/70">{item.label}</dt>
            <dd className={`mt-1 font-display text-3xl font-black tabular-nums ${item.intel ? 'text-intel' : 'text-ink'}`}>{item.value}</dd>
            {item.sub && <dd className="text-xs text-ink-muted">{item.sub}</dd>}
          </div>
        ))}
      </dl>

      <section aria-labelledby="hunt-moves" className="border border-gold/30 bg-black/50 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-4xl font-black uppercase leading-none text-gold sm:text-5xl">Net FTE = BPT + VD</p>
            <p className="mt-2 font-display text-xl font-bold uppercase tracking-wide text-ink sm:text-2xl">PO telt niet mee.</p>
          </div>
          <h3 id="hunt-moves" className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-gold/80">
            Hoe pakken we FTE?
          </h3>
        </div>
        <ol className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {MOVES.map(({ code, label, icon: Icon }) => (
            <li key={code} className="flex items-center gap-3 border border-gold/25 bg-mission-void/70 px-4 py-4">
              <span className="font-display text-3xl font-black text-gold/60">{code}</span>
              <span className="flex items-center gap-2 font-display text-lg font-bold uppercase leading-tight text-ink sm:text-xl">
                <Icon size={18} className="hidden shrink-0 text-gold sm:block" aria-hidden />
                {label}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-label="One-liner" className="flex flex-col border border-gold/30 bg-black/50 px-5 py-6 sm:px-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-gold/80">Mission brief</p>
          <div key={lineLock} className="relative mt-4 flex min-h-[120px] flex-1 items-center animate-target-lock px-4 py-4">
            <HudCorners />
            <p data-testid="hunt-one-liner" aria-live="polite" className="font-display text-2xl font-black uppercase leading-tight text-ink sm:text-3xl">
              {line}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLine((current) => pickDifferent(HUNT_ONE_LINERS, current, random));
              setLineLock((n) => n + 1);
            }}
            className="mt-5 inline-flex items-center justify-center gap-2 border border-gold px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/15"
          >
            <Zap size={14} aria-hidden />
            Geef me nog één
          </button>
        </section>

        <section aria-label="Sales missie" className="flex flex-col border border-gold/30 bg-black/50 px-5 py-6 sm:px-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-gold/80">Sales mission generator</p>
          <div key={missionLock} className={`relative mt-4 flex min-h-[120px] flex-1 flex-col justify-center px-4 py-4 ${mission ? 'animate-target-lock' : ''}`}>
            {mission && <HudCorners />}
            {mission ? (
              <>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-gold">Missie</p>
                <p data-testid="hunt-mission" aria-live="polite" className="mt-1 text-lg font-semibold leading-snug text-ink sm:text-xl">
                  {mission}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-muted">Klik voor één concrete actie die vandaag FTE oplevert.</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setMission((current) => pickDifferent(HUNT_MISSIONS, current, random));
              setMissionLock((n) => n + 1);
            }}
            className="mt-5 inline-flex items-center justify-center gap-2 border border-gold px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/15"
          >
            <Dices size={14} aria-hidden />
            Geef mij een missie
          </button>
        </section>
      </div>

      <section aria-label="FTE-bon" className="relative overflow-hidden border border-gold bg-gold/[0.12] px-5 py-8 text-center shadow-gold-lg sm:py-10">
        <HudCorners />
        <p className="font-display text-3xl font-black uppercase tracking-wide text-ink sm:text-4xl">Move gemaakt?</p>
        <button
          type="button"
          onClick={onPakFteBon}
          className="mt-5 inline-flex items-center gap-3 bg-gold px-8 py-4 font-display text-xl font-black uppercase tracking-[0.12em] text-mission-deep transition-colors hover:bg-gold-bright sm:text-2xl"
        >
          Pak je FTE-bon
          <ArrowRight size={22} aria-hidden />
        </button>
      </section>
    </div>
  );
}

/**
 * HUNT MODE — the salesmeeting war room, a fullscreen overlay on top of the
 * normal app (which stays mounted underneath). Everything it shows comes
 * from the existing snapshot, projection service and FTE-bonnen hook via
 * getHuntIntel; it holds no business logic of its own. A real modal: focus
 * is trapped inside, Escape and EXIT HUNT MODE always close it, and the
 * page behind it doesn't scroll.
 */
export function HuntModeOverlay({ showIntro, onExit, onPakFteBon, random = Math.random }: HuntModeOverlayProps) {
  const { standings, updatedAt } = getMissionSnapshot();
  const { openFte, openBonnen } = useFteBonnen();
  const intel = getHuntIntel(standings, OWN_TEAM, openFte);
  const [phase, setPhase] = useState<'intro' | 'room'>(showIntro ? 'intro' : 'room');
  const dialogRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (phase !== 'intro') return;
    const timer = window.setTimeout(() => setPhase('room'), HUNT_INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Modal behaviour: lock page scroll, focus inside, restore focus on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    exitRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
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
    },
    [onExit],
  );

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hunt-title"
      onKeyDown={handleKeyDown}
      data-testid="hunt-mode"
      className="fixed inset-0 z-[70] overflow-y-auto text-ink animate-[intro-quickfade_0.6s_ease-out_both]"
    >
      <ControlRoomEnvironment />
      <HuntHud />

      <div className="sticky top-0 z-10 border-b border-gold/30 bg-black/70 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <p className="flex min-w-0 items-center gap-2 truncate font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
            <Crosshair size={15} className="shrink-0" aria-hidden />
            <span className="truncate">Hunt Mode · Team Zwolle</span>
            <StatusLed tone="gold" />
          </p>
          <button
            ref={exitRef}
            type="button"
            onClick={onExit}
            className="inline-flex shrink-0 items-center gap-2 border border-gold/50 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/15"
          >
            <X size={14} aria-hidden />
            Exit Hunt Mode
          </button>
        </div>
      </div>

      {phase === 'intro' ? (
        <HuntIntro intel={intel} onSkip={() => setPhase('room')} />
      ) : (
        <HuntRoom intel={intel} officialDate={formatPowerBiTime(updatedAt)} openCount={openBonnen.length} random={random} onPakFteBon={onPakFteBon} />
      )}
    </div>
  );
}
