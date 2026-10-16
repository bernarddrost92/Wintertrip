import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Crosshair, Flame, X } from 'lucide-react';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { useFteBonnen } from '../../hooks/useFteBonnen';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { getMissionSnapshot } from '../../services/missionSnapshot';
import { formatFactor, formatSignedFte } from '../../utils/format';
import { formatPowerBiTime } from '../../utils/snapshotTime';
import { HuntRange } from '../hunt-range/HuntRange';
import { getRangeTargets } from '../hunt-range/huntRangeLines';
import { HuntBackdrop } from './HuntBackdrop';
import { HuntHero } from './HuntHero';
import { getHuntIntel } from './huntIntel';
import { HUNT_MISSIONS, HUNT_ONE_LINERS, pickDifferent } from './huntLines';
import { HuntMovesStrip } from './HuntMovesStrip';
import { HuntRevealOverlay } from './HuntRevealOverlay';
import { HuntSecondaryIntel } from './HuntSecondaryIntel';
import { huntEntryDelays } from './huntTimeline';
import { WarRoom } from './WarRoom';
import './hunt3.css';

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type Reveal = { kind: 'mission'; text: (typeof HUNT_MISSIONS)[number] } | { kind: 'line'; text: (typeof HUNT_ONE_LINERS)[number] } | null;

interface HuntModeOverlayProps {
  /** A deliberate activation (not a restore after reload): the hero rises
   * in after the MISSION ACTIVATED stamp. */
  fromActivation: boolean;
  onExit: () => void;
  /** Closes Hunt Mode and opens the existing FTE Bon Calculator. */
  onPakFteBon: () => void;
  /** Injectable for tests. */
  random?: () => number;
}

/**
 * HUNT MODE — the approved design (Wintertrip_Hunt_Mode_Redesign_Pack):
 * scene → target → action. A fullscreen overlay on top of the normal app
 * (which stays mounted underneath). The first viewport is the cinematic
 * hero — headline, one live strip with the target in the centre, three
 * actions — plus the four moves and one line of intel; the rest of the
 * intelligence sits calmly below the fold. GEEF MIJ EEN MISSIE and GEEF ME
 * VUUR open a full-screen reveal; the War Room stays one click away.
 *
 * Every figure comes from getHuntIntel (snapshot + projection service +
 * FTE-bonnen hook); no business logic lives here. A real modal: focus is
 * trapped, Escape closes the top-most layer first (reveal / War Room, then
 * Hunt Mode), and the page behind doesn't scroll.
 */
export function HuntModeOverlay({ fromActivation, onExit, onPakFteBon, random = Math.random }: HuntModeOverlayProps) {
  const { standings, updatedAt } = getMissionSnapshot();
  const { openFte, openBonnen } = useFteBonnen();
  const intel = getHuntIntel(standings, OWN_TEAM, openFte);
  const reduced = usePrefersReducedMotion();
  const officialDate = formatPowerBiTime(updatedAt);
  const delays = huntEntryDelays(fromActivation, reduced);
  const entering = fromActivation && !reduced;
  const [reveal, setReveal] = useState<Reveal>(null);
  const [warRoom, setWarRoom] = useState(false);
  const [range, setRange] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);

  // Modal behaviour: lock page scroll, focus inside, restore focus on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Hunt Mode always opens at the top; the app keeps its own scroll
    // position underneath (body scroll is only locked, never moved).
    if (dialogRef.current) dialogRef.current.scrollTop = 0;
    exitRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
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

  const nextMission = () => setReveal((current) => ({ kind: 'mission', text: pickDifferent(HUNT_MISSIONS, current?.kind === 'mission' ? current.text : null, random) }));
  const nextLine = () => setReveal((current) => ({ kind: 'line', text: pickDifferent(HUNT_ONE_LINERS, current?.kind === 'line' ? current.text : null, random) }));

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hunt-title"
      onKeyDown={handleKeyDown}
      data-testid="hunt-mode"
      className={`hunt3-shell fixed inset-0 z-[70] overflow-y-auto ${entering ? '' : 'animate-[intro-quickfade_0.4s_ease-out_both]'}`}
    >
      <HuntBackdrop entering={entering} />

      {/* Top bar: deliberately quieter than the hero — the hero always wins. */}
      <div className={`hunt3-topbar sticky top-0 z-10 ${entering ? 'hunt3-enter-room' : ''}`}>
        <div className="flex h-[52px] items-center justify-between gap-3 px-4 sm:h-[56px] sm:px-[42px]">
          <p className="hunt3-kicker-top min-w-0">
            <span className="hunt3-led" aria-hidden />
            <span className="truncate">
              Team Zwolle<span className="hidden sm:inline"> // live intelligence</span>
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hunt3-topbar-meta hidden xl:inline">Hunt mode active · Power BI {officialDate}</span>
            <button type="button" onClick={() => setRange(true)} className="hunt3-topbar-button hunt3-topbar-range" aria-label="Open Hunt Range" title="Open Hunt Range">
              <Crosshair size={14} aria-hidden />
              <span className="hidden sm:inline">Open Hunt Range</span>
            </button>
            <button type="button" onClick={() => setWarRoom(true)} className="hunt3-topbar-button" aria-label="Open War Room" title="Open War Room">
              <Flame size={14} aria-hidden />
              <span className="hidden sm:inline">Open War Room</span>
            </button>
            <button ref={exitRef} type="button" onClick={onExit} className="hunt3-topbar-button">
              <X size={14} aria-hidden />
              Exit<span className="hidden sm:inline"> Hunt Mode</span>
            </button>
          </div>
        </div>
      </div>

      <div className="hunt3-first">
        <HuntHero intel={intel} delays={delays} onMission={nextMission} onMotivation={nextLine} onPakFteBon={onPakFteBon}>
          <HuntMovesStrip />
          <p className="hunt3-rule hunt3-rule-mobile">Net FTE = BPT + VD · PO telt niet mee</p>
        </HuntHero>
        <div className="hunt3-bottom animate-hunt-rise" style={{ animationDelay: `${delays.moves}ms` }}>
          <div className="hunt3-pills">
            <span className="hunt3-pill">Factor {formatFactor(intel.factor)}</span>
            <span className="hunt3-pill hunt3-pill-intel">Projectie #{intel.projectedNetFteRank}</span>
            <span className="hunt3-pill">Open {formatSignedFte(intel.openFte)} FTE</span>
          </div>
          <div className="hunt3-rule">Net FTE = BPT + VD · PO telt niet mee</div>
        </div>
      </div>

      <HuntSecondaryIntel intel={intel} officialDate={officialDate} openCount={openBonnen.length} onOpenWarRoom={() => setWarRoom(true)} onOpenRange={() => setRange(true)} onPakFteBon={onPakFteBon} />

      {reveal && (
        <HuntRevealOverlay
          eyebrow={reveal.kind === 'mission' ? 'Missie // secure channel' : 'Mission brief // secure channel'}
          text={reveal.text}
          kind={reveal.kind}
          againLabel={reveal.kind === 'mission' ? 'Nog een missie' : 'Nog één'}
          onAgain={reveal.kind === 'mission' ? nextMission : nextLine}
          onClose={() => setReveal(null)}
        />
      )}

      {range && (
        <HuntRange
          targets={getRangeTargets(standings, OWN_TEAM, openFte)}
          random={random}
          onClose={() => setRange(false)}
          onPakFteBon={() => {
            setRange(false);
            onPakFteBon();
          }}
        />
      )}

      {warRoom && (
        <WarRoom
          intel={intel}
          onClose={() => setWarRoom(false)}
          onPakFteBon={() => {
            setWarRoom(false);
            onPakFteBon();
          }}
        />
      )}
    </div>
  );
}
