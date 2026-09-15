import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { filterProjectsByStatus } from '../../services/missionHuntAggregate';
import { ProjectRow } from './ProjectRow';
import { StatusFilterBar } from './StatusFilterBar';
import type { AgentSummary } from '../../services/missionHuntAggregate';
import type { MissionHuntProject, ProjectStatus } from '../../types/missionHunt';

interface AgentDrawerProps {
  summary: AgentSummary;
  ownProjects: MissionHuntProject[];
  editable: boolean;
  initialFilter?: ProjectStatus | 'all';
  onClose: () => void;
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onOpenProject: (projectId: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

/**
 * Only reachable by clicking a person on the Team Dashboard — this is where
 * that person's actual project list lives. Next/Previous lets the Friday
 * meeting move person to person without closing and reopening (spec section
 * 26), and the status filter starts at ALL every time it opens fresh.
 */
export function AgentDrawer({ summary, ownProjects, editable, initialFilter = 'all', onClose, onStatusChange, onOpenProject, onNext, onPrevious }: AgentDrawerProps) {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>(initialFilter);
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

  const projects = filterProjectsByStatus(ownProjects, filter);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Projecten van ${summary.profile.displayName}`}
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
              <p className="truncate font-display text-lg font-bold uppercase tracking-wide text-ink">{summary.profile.displayName}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-muted">
                {summary.counts.total} PROJECTS · {summary.reviewPercent}% REVIEWED
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
          <StatusFilterBar value={filter} onChange={setFilter} />
        </div>

        <div className="overflow-y-auto px-4 py-2 sm:px-6">
          {projects.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">Geen projecten met deze status.</p>
          ) : (
            projects.map((project) => (
              <ProjectRow key={project.id} project={project} editable={editable} onStatusChange={(status) => onStatusChange(project.id, status)} onOpen={() => onOpenProject(project.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
