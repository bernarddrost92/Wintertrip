import type { NetFteTarget } from '../../services/netFteProjection';
import { formatSignedFte } from '../../utils/format';
import type { RangeHitLine } from './huntRangeLines';

interface HuntRangeHitMessageProps {
  line: RangeHitLine;
  target: NetFteTarget;
}

/** The one-liner after a hit, with the live target underneath: who was hit
 * and how much real FTE it takes to actually pass them. */
export function HuntRangeHitMessage({ line, target }: HuntRangeHitMessageProps) {
  return (
    <div className="hr-message" role="status" data-testid="range-hit-message">
      <p className="hr-message-title">{line.title}</p>
      <p className="hr-message-body">{line.body}</p>
      <p className="hr-message-intel">
        <span>
          Target hit · <strong>{target.team.toUpperCase()} #{target.rank}</strong>
        </span>
        <span>
          Nodig: <strong className="hr-gold">{formatSignedFte(target.fteNeeded)} FTE</strong>
        </span>
      </p>
    </div>
  );
}
