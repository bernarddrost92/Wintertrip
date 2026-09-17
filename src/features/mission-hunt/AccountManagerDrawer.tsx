import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { classifyPlacement } from '../../services/missionHuntClassification';
import { placementMatchesFilter, type PlacementFilter } from '../../services/missionHuntOpportunity';
import { PlacementRow } from './PlacementRow';
import { PlacementFilterBar } from './PlacementFilterBar';
import type { AccountManagerSummary } from '../../services/missionHuntAggregate';

interface AccountManagerDrawerProps {
  summary: AccountManagerSummary;
  initialFilter?: PlacementFilter;
  onClose: () => void;
  onOpenPlacement: (placementId: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

/**
 * Only reachable by clicking a person on Friday Review — this is where
 * that person's actual placement list lives. Next/Previous lets the
 * Friday meeting move person to person without closing and reopening.
 */
export function AccountManagerDrawer({ summary, initialFilter = 'all-opportunities', onClose, onOpenPlacement, onNext, onPrevious }: AccountManagerDrawerProps) {
  const [filter, setFilter] = useState<PlacementFilter>(initialFilter);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  const placements = summary.placements.filter((p) => placementMatchesFilter(classifyPlacement(p.startDate, p.endDate, p.hoursPerWeek), filter));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Plaatsingen van ${summary.displayName}`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-mission-void/92 px-3 py-6 backdrop-blur-sm sm:items-center sm:px-6"
      onClick={handleBackdropClick}
    >
      <div className="flex max-h-full w-full max-w-xl flex-col border border-gold/30 bg-mission-panel shadow-gold-lg">
        <div className="flex items-start justify-between gap-3 border-b border-gold/15 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {onPrevious && (
              <button type="button" onClick={onPrevious} aria-label="Vorige teamlid" className="p-1.5 text-ink-muted hover:text-gold">
                <ChevronLeft size={16} aria-hidden />
              </button>
            )}
            <div className="min-w-0">
              <p className="label-classified text-gold/70">Team Zwolle</p>
              <p className="truncate font-display text-lg font-bold uppercase tracking-wide text-ink">{summary.displayName}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-muted">
                {summary.counts.total} PLAATSINGEN · {summary.isVerified ? 'GECONTROLEERD' : 'NOG CONTROLEREN'}
              </p>
            </div>
            {onNext && (
              <button type="button" onClick={onNext} aria-label="Volgende teamlid" className="p-1.5 text-ink-muted hover:text-gold">
                <ChevronRight size={16} aria-hidden />
              </button>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="flex shrink-0 items-center justify-center border border-gold/30 p-2 text-gold transition-colors duration-150 hover:border-gold hover:bg-gold/10"
          >
            <X size={15} aria-hidden />
          </button>
        </div>

        <div className="border-b border-white/8 px-4 py-3 sm:px-6">
          <PlacementFilterBar value={filter} onChange={setFilter} />
        </div>

        <div className="overflow-y-auto px-4 py-2 sm:px-6">
          {placements.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">Geen plaatsingen met deze kans.</p>
          ) : (
            placements.map((placement) => <PlacementRow key={placement.id} placement={placement} onOpen={() => onOpenPlacement(placement.id)} />)
          )}
        </div>
      </div>
    </div>
  );
}
