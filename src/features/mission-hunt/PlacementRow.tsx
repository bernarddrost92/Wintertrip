import { classifyPlacement } from '../../services/missionHuntClassification';
import { badgesForClassification } from '../../services/missionHuntOpportunity';
import { formatIsoDateNl } from '../../utils/dates';
import type { MissionHuntPlacement } from '../../types/missionHunt';

interface PlacementRowProps {
  placement: MissionHuntPlacement;
  onOpen: () => void;
}

/**
 * One line per placement, built to scan 20-30 of these in a few seconds.
 * Professional is the bold title (per the spec's own display example),
 * Klant/DB/uren/dates below, opportunity badges — fully automatic, nobody
 * picks these — on the right. The whole row opens the detail view; there
 * is no separate status control to tap around anymore.
 */
export function PlacementRow({ placement, onOpen }: PlacementRowProps) {
  const classification = classifyPlacement(placement.startDate, placement.endDate);
  const badges = badgesForClassification(classification);
  const metaParts = [
    placement.clientName,
    placement.monthlyDb !== null ? `${placement.monthlyDb} DB` : null,
    placement.hoursPerWeek !== null ? `${placement.hoursPerWeek} uur` : null,
  ].filter(Boolean);

  return (
    <button type="button" onClick={onOpen} className="flex w-full flex-col gap-1.5 border-b border-white/8 py-3 text-left last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold uppercase tracking-wide text-ink">{placement.professionalName || '—'}</p>
          <p className="truncate text-xs text-ink-muted">{metaParts.join(' · ')}</p>
          {placement.startDate && placement.endDate && (
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted/80">
              {formatIsoDateNl(placement.startDate)} → {formatIsoDateNl(placement.endDate)}
            </p>
          )}
        </div>
      </div>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {badges.map((badge) => (
            <span key={badge.label} className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">
              <span aria-hidden>{badge.icon}</span>
              {badge.label}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
