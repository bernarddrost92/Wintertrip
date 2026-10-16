import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, Crosshair, Dices, Flame } from 'lucide-react';
import { formatSignedFte } from '../../utils/format';
import type { HuntIntel } from './huntIntel';
import type { HuntEntryDelays } from './huntTimeline';

interface HuntHeroProps {
  intel: HuntIntel;
  /** When each part enters (see huntTimeline.ts). */
  delays: HuntEntryDelays;
  onMission: () => void;
  onMotivation: () => void;
  onPakFteBon: () => void;
  /** Rendered right under the actions — the four moves strip. */
  children?: ReactNode;
}

/**
 * The Hunt Mode hero (approved design, preview/index.html): no card, no
 * panel — the headline, then one thin live strip with the target in the
 * centre, then the three actions. Every figure comes from HuntIntel.
 */
export function HuntHero({ intel, delays, onMission, onMotivation, onPakFteBon, children }: HuntHeroProps) {
  const target = intel.nextTarget;
  const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

  return (
    <section className="hunt3-hero" aria-labelledby="hunt-title">
      <div className="hunt3-kicker animate-hunt-rise" style={delay(delays.kicker)}>
        Operation January // target locked
      </div>

      <h2 id="hunt-title" className="hunt3-title animate-hunt-rise" style={delay(delays.title)}>
        The Net FTE
        <span>Hunt is on</span>
      </h2>

      <div className="hunt3-live-strip animate-hunt-rise" style={delay(delays.strip)}>
        <div className="hunt3-metric" role="group" aria-label="Onze kracht · VCDB">
          <div className="hunt3-metric-label">Onze kracht · VCDB</div>
          <div className="hunt3-rank">#{intel.vcdbRank}</div>
        </div>

        {/* The target locks once (ring + scan line), then stands still. */}
        <div
          className="hunt3-target"
          role="group"
          aria-label={target ? 'Target acquired' : 'Target secured'}
          data-testid="hunt-next-target"
          style={{ '--hunt3-lock-delay': `${delays.strip}ms` } as CSSProperties}
        >
          <span className="hunt3-lock-ring" aria-hidden />
          <span className="hunt3-lock-scan" aria-hidden />
          <div className="hunt3-metric-label">
            <Crosshair size={13} aria-hidden /> {target ? 'Target acquired' : 'Target secured'}
          </div>
          {target ? (
            <>
              <div className="hunt3-target-name">
                #{target.rank} {target.team}
              </div>
              <div className="hunt3-fte-needed hunt3-after-lock">{formatSignedFte(target.fteNeeded)} FTE</div>
            </>
          ) : (
            <>
              <div className="hunt3-target-name">Net FTE #1</div>
              <div className="hunt3-fte-needed hunt3-after-lock">Vasthouden</div>
            </>
          )}
        </div>

        <div className="hunt3-metric" role="group" aria-label="De missie · Net FTE">
          <div className="hunt3-metric-label">De missie · Net FTE</div>
          <div className="hunt3-rank hunt3-gold">#{intel.netFteRank}</div>
        </div>
      </div>

      <div className="hunt3-actions animate-hunt-rise" style={delay(delays.actions)}>
        <button type="button" onClick={onMission} className="hunt3-button hunt3-button-secondary">
          <Dices size={16} aria-hidden /> Geef mij een missie
        </button>
        <button type="button" onClick={onPakFteBon} className="hunt3-button hunt3-button-primary">
          Pak FTE-bon <ArrowRight size={17} aria-hidden />
        </button>
        <button type="button" onClick={onMotivation} className="hunt3-button hunt3-button-secondary">
          <Flame size={16} aria-hidden /> Geef me vuur
        </button>
      </div>

      {children && (
        <div className="w-full animate-hunt-rise" style={delay(delays.moves)}>
          {children}
        </div>
      )}
    </section>
  );
}
