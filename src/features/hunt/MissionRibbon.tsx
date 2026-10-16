import { useState, type ReactNode } from 'react';
import { ArrowRight, Crosshair } from 'lucide-react';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { useFteBonnen } from '../../hooks/useFteBonnen';
import { getMissionSnapshot } from '../../services/missionSnapshot';
import { formatFactor, formatSignedFte } from '../../utils/format';
import { getHuntIntel } from './huntIntel';
import { HUNT_ONE_LINERS, pickDifferent } from './huntLines';

interface MissionRibbonProps {
  /** Goes to the existing FTE Bon Calculator on the Net FTE page. */
  onPakFteBon: () => void;
}

/**
 * One instrument segment. Below lg the ribbon scrolls and segments keep
 * their natural width; from lg they grow to share the full width, so the
 * strip reads edge to edge with no gap before the CTA. The thin separator
 * is each segment's left edge (the first segment has none).
 */
function Segment({ children, first = false, className = '' }: { children: ReactNode; first?: boolean; className?: string }) {
  return (
    <div
      className={`flex h-full shrink-0 items-center whitespace-nowrap px-3 lg:flex-[1_0_auto] lg:px-2 xl:px-3 ${
        first ? 'pl-0 lg:pl-0' : 'border-l border-mission-deep/25 lg:justify-center'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * The thin champagne-gold mission ribbon under the navbar — the Net FTE
 * hunt at a glance, every number live from the official standings plus the
 * open FTE-bonnen. It stands still (no ticker); the one-liner is picked
 * once per page load, sits quieter than the numbers and is the first thing
 * to give way: on laptops (lg–xl) it is left out. On narrow screens it scrolls horizontally with the essentials and
 * the CTA up front; from lg it fills the full width, CTA on the right.
 */
export function MissionRibbon({ onPakFteBon }: MissionRibbonProps) {
  const { standings } = getMissionSnapshot();
  const { openFte } = useFteBonnen();
  const intel = getHuntIntel(standings, OWN_TEAM, openFte);
  const [line] = useState(() => pickDifferent(HUNT_ONE_LINERS, null));
  const target = intel.nextTarget;

  return (
    <section
      aria-label="Net FTE hunt"
      data-testid="mission-ribbon"
      className="relative z-30 border-b border-gold-deep/40 text-mission-deep"
      style={{ background: 'linear-gradient(90deg, #C7A767 0%, #DCC28C 45%, #E4CF9F 55%, #C7A767 100%)' }}
    >
      <div className="flex h-11 w-full items-center overflow-x-auto px-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] [scrollbar-width:none] sm:px-6 lg:px-4 lg:tracking-[0.08em] xl:px-6 xl:tracking-[0.14em] [&::-webkit-scrollbar]:hidden">
        <Segment first>
          <span className="flex items-center gap-1.5 font-display text-sm font-black tracking-[0.14em]">
            <Crosshair size={14} aria-hidden />
            Net FTE Hunt
          </span>
        </Segment>
        <Segment>VCDB #{intel.vcdbRank}</Segment>
        <Segment>Net FTE #{intel.netFteRank}</Segment>
        {target ? (
          <>
            <Segment>
              Next target #{target.rank} {target.team}
            </Segment>
            <Segment className="font-black">{formatSignedFte(target.fteNeeded)} FTE nodig</Segment>
          </>
        ) : (
          <Segment>#1 in Net FTE — vasthouden</Segment>
        )}
        <Segment className="order-2 lg:order-none">Factor {formatFactor(intel.factor)}</Segment>
        <Segment className="order-2 lg:order-none">Projectie #{intel.projectedNetFteRank}</Segment>
        <Segment className="order-2 font-semibold text-mission-deep/70 lg:hidden lg:order-none 2xl:flex 2xl:min-w-0 2xl:flex-[1_1_auto]">
          <span className="2xl:truncate" data-testid="mission-ribbon-line">
            {line}
          </span>
        </Segment>
        <Segment className="order-1 lg:order-none lg:flex-none lg:justify-end lg:pr-0">
          <button
            type="button"
            onClick={onPakFteBon}
            className="inline-flex items-center gap-1.5 border border-mission-deep/40 px-2.5 py-1 font-black transition-colors hover:bg-mission-deep hover:text-gold-bright"
          >
            Pak FTE-bon
            <ArrowRight size={12} aria-hidden />
          </button>
        </Segment>
      </div>
    </section>
  );
}
