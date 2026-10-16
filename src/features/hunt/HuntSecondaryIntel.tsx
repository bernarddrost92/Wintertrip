import { ArrowRight, Flame } from 'lucide-react';
import { formatFactor, formatSignedFte, formatVcdbValue } from '../../utils/format';
import type { HuntIntel } from './huntIntel';

interface HuntSecondaryIntelProps {
  intel: HuntIntel;
  officialDate: string;
  openCount: number;
  onOpenWarRoom: () => void;
  onPakFteBon: () => void;
}

/**
 * Below the fold: the calm secondary intelligence — factor, final position,
 * open FTE-bonnen, the projection (blue) and the official Power BI date —
 * then the Net FTE rule, the War Room entry and the closing FTE-bon CTA.
 */
export function HuntSecondaryIntel({ intel, officialDate, openCount, onOpenWarRoom, onPakFteBon }: HuntSecondaryIntelProps) {
  const items = [
    { label: 'Factor', value: formatFactor(intel.factor) },
    { label: 'Eindstand', value: `#${intel.finalPosition}` },
    { label: 'Open FTE-bonnen', value: formatSignedFte(intel.openFte), sub: `${openCount} open` },
    { label: 'Projectie FTE-rank', value: `#${intel.projectedNetFteRank}`, sub: 'incl. open bonnen', blue: true },
    { label: 'Projectie Net FTE', value: formatVcdbValue(intel.projectedNetFte), sub: 'incl. open bonnen', blue: true },
    { label: 'Officieel', value: 'Power BI', sub: officialDate },
  ];

  return (
    <section className="hunt3-secondary" aria-label="Secundaire intelligence">
      <p className="hunt3-section-label">Intelligence · Power BI {officialDate}</p>
      <dl className="hunt3-intel-grid">
        {items.map((item) => (
          <div key={item.label} className={`hunt3-intel ${item.blue ? 'hunt3-intel-blue' : ''}`}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
            {item.sub && <small>{item.sub}</small>}
          </div>
        ))}
      </dl>

      <div className="hunt3-rule-block">
        <p className="hunt3-rule-main">Net FTE = BPT + VD</p>
        <p className="hunt3-rule-sub">PO telt niet mee</p>
      </div>

      <div className="hunt3-closing">
        <p>Move gemaakt?</p>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={onOpenWarRoom} className="hunt3-button hunt3-button-secondary">
            <Flame size={16} aria-hidden /> Activate War Room
          </button>
          <button type="button" onClick={onPakFteBon} className="hunt3-button hunt3-button-primary">
            Pak je FTE-bon <ArrowRight size={17} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
