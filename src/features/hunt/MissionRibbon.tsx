import { useState } from 'react';
import { ArrowRight, Crosshair } from 'lucide-react';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { useFteBonnen } from '../../hooks/useFteBonnen';
import { getMissionSnapshot } from '../../services/missionSnapshot';
import { formatSignedFte } from '../../utils/format';
import { getHuntIntel } from './huntIntel';
import { HUNT_ONE_LINERS, pickDifferent } from './huntLines';

interface MissionRibbonProps {
  /** Goes to the existing FTE Bon Calculator on the Net FTE page. */
  onPakFteBon: () => void;
}

function Sep() {
  return <span className="h-4 w-px shrink-0 bg-mission-deep/25" aria-hidden />;
}

/**
 * The thin champagne-gold mission ribbon under the navbar — the Net FTE
 * hunt at a glance, every number live from the official standings plus the
 * open FTE-bonnen. It stands still (no ticker); the one-liner is picked
 * once per page load. Scrolls horizontally on narrow screens.
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
      <div className="mx-auto flex h-11 max-w-[1800px] items-center gap-3 overflow-x-auto whitespace-nowrap px-4 font-mono text-[11px] font-bold uppercase tracking-[0.16em] [scrollbar-width:none] sm:gap-4 sm:px-6 [&::-webkit-scrollbar]:hidden">
        <span className="flex shrink-0 items-center gap-1.5 font-display text-sm font-black tracking-[0.14em]">
          <Crosshair size={14} aria-hidden />
          Net FTE Hunt
        </span>
        <Sep />
        <span className="shrink-0">VCDB #{intel.vcdbRank}</span>
        <Sep />
        <span className="shrink-0">Net FTE #{intel.netFteRank}</span>
        <Sep />
        {target ? (
          <>
            <span className="shrink-0">
              Next target #{target.rank} {target.team}
            </span>
            <Sep />
            <span className="shrink-0 font-black">{formatSignedFte(target.fteNeeded)} FTE nodig</span>
          </>
        ) : (
          <span className="shrink-0">#1 in Net FTE — vasthouden</span>
        )}
        <Sep />
        <span className="shrink-0 font-semibold text-mission-deep/75">{line}</span>
        <button
          type="button"
          onClick={onPakFteBon}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 border border-mission-deep/40 px-2.5 py-1 font-black transition-colors hover:bg-mission-deep hover:text-gold-bright"
        >
          Pak FTE-bon
          <ArrowRight size={12} aria-hidden />
        </button>
      </div>
    </section>
  );
}
