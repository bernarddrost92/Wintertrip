import { Fragment } from 'react';
import { ArrowRight, Crosshair } from 'lucide-react';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { useFteBonnen } from '../../hooks/useFteBonnen';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { getMissionSnapshot } from '../../services/missionSnapshot';
import { formatFactor, formatSignedFte } from '../../utils/format';
import { getHuntIntel } from './huntIntel';

interface MissionRibbonProps {
  /** Goes to the existing FTE Bon Calculator on the Net FTE page. */
  onPakFteBon: () => void;
}

interface TickerItem {
  label: string;
  value: string;
  /** The one figure in an item that carries the gold. */
  accent?: boolean;
}

const RIBBON_MOTTO = 'BPT + VD. Dat is de opdracht.';

/** How often the item list repeats inside one half of the track — enough
 * that a half is always wider than even a very wide screen, so the loop
 * never shows a gap. */
const REPEATS = 3;

function TickerRun({ items, hidden = false }: { items: TickerItem[]; hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {Array.from({ length: REPEATS }, (_, r) => (
        // Only the very first pass is read out; the repeats are visual.
        <div key={r} className="flex shrink-0 items-center" aria-hidden={(!hidden && r > 0) || undefined}>
          {items.map((item, i) => (
            <Fragment key={i}>
              <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap px-4 sm:px-5">
                {item.label && <span className="text-ink-muted">{item.label}</span>}{item.label && ' '}
                <span className={item.accent ? 'text-gold-bright [text-shadow:0_0_12px_rgba(214,174,85,0.28)]' : 'text-ink'}>{item.value}</span>
              </span>
              <span className="h-1 w-1 shrink-0 rotate-45 bg-gold/55" aria-hidden />
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * The live intel ticker under the navbar — a slim charcoal strip with a
 * fixed matte-gold NET FTE HUNT tab on the left, a fixed PAK FTE-BON on the
 * right, and the hunt figures gliding through the middle. Every figure is
 * live from the official standings plus the open FTE-bonnen (getHuntIntel).
 *
 * The loop is seamless: the track holds two identical halves and slides by
 * exactly -50%, so the reset lands on identical content. It pauses on hover
 * and keyboard focus; with prefers-reduced-motion it stands still and can
 * be scrolled by hand instead.
 */
export function MissionRibbon({ onPakFteBon }: MissionRibbonProps) {
  const { standings } = getMissionSnapshot();
  const { openFte } = useFteBonnen();
  const intel = getHuntIntel(standings, OWN_TEAM, openFte);
  const reduced = usePrefersReducedMotion();
  const target = intel.nextTarget;

  const items: TickerItem[] = [
    { label: 'VCDB', value: `#${intel.vcdbRank}` },
    { label: 'Net FTE', value: `#${intel.netFteRank}`, accent: true },
    ...(target
      ? [
          { label: 'Next target', value: `#${target.rank} ${target.team}` },
          { label: '', value: `${formatSignedFte(target.fteNeeded)} FTE nodig`, accent: true },
        ]
      : [{ label: 'Net FTE', value: '#1 — vasthouden', accent: true }]),
    { label: 'Factor', value: formatFactor(intel.factor) },
    { label: '', value: RIBBON_MOTTO },
  ];

  return (
    <section
      aria-label="Net FTE hunt"
      data-testid="mission-ribbon"
      className="group/ribbon relative z-30 flex h-8 w-full items-stretch border-y border-gold/25 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] sm:h-9 sm:text-[11px]"
      style={{ background: 'linear-gradient(180deg, #171B21 0%, #111419 100%)', boxShadow: 'inset 0 1px 0 rgba(231,200,117,0.06)' }}
    >
      {/* Fixed left tab — the one solid gold surface besides the CTA. */}
      <div className="relative flex shrink-0 items-center gap-1.5 bg-[#C9AD74] px-3 text-mission-deep sm:px-4">
        <Crosshair size={13} aria-hidden />
        <span className="hidden font-display text-xs font-black tracking-[0.18em] sm:inline">Net FTE Hunt</span>
        <span className="font-display text-xs font-black tracking-[0.18em] sm:hidden">Hunt</span>
        <span className="pointer-events-none absolute -right-px top-0 h-full w-px bg-gold-bright/60" aria-hidden />
      </div>

      {/* The ticker window, softly faded at both edges. */}
      <div
        className={`relative min-w-0 flex-1 overflow-hidden ${reduced ? 'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`}
        style={{
          maskImage: 'linear-gradient(90deg, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)',
        }}
      >
        <div
          data-testid="mission-ribbon-track"
          className={`flex h-full w-max items-center ${
            reduced
              ? ''
              : 'animate-intel-ticker will-change-transform group-hover/ribbon:[animation-play-state:paused] group-focus-within/ribbon:[animation-play-state:paused]'
          }`}
        >
          <TickerRun items={items} />
          {!reduced && <TickerRun items={items} hidden />}
        </div>
      </div>

      {/* Fixed right CTA. */}
      <div className="flex shrink-0 items-center border-l border-gold/20 px-2 sm:px-3">
        <button
          type="button"
          onClick={onPakFteBon}
          className="inline-flex items-center gap-1.5 whitespace-nowrap bg-[#C9AD74] px-2.5 py-1 font-bold text-mission-deep transition-colors hover:bg-gold-bright focus-visible:outline-offset-2 sm:px-3"
        >
          Pak FTE-bon
          <ArrowRight size={12} aria-hidden />
        </button>
      </div>
    </section>
  );
}
