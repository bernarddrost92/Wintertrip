import { StatusPicker } from './StatusPicker';
import type { MissionHuntProject, ProjectStatus } from '../../types/missionHunt';

interface ProjectRowProps {
  project: MissionHuntProject;
  editable: boolean;
  onStatusChange: (status: ProjectStatus) => void;
  onOpen: () => void;
}

/**
 * One line per project, built to scan 20-30 of these in a few seconds — no
 * card chrome, no wasted vertical space. Project + client/professional on
 * the left, status control on the right; clicking anywhere on the row text
 * opens the detail view, clicking the status pill itself never bubbles into
 * that (StatusPicker's button stops nothing — it just sits visually to the
 * side so the two tap targets don't overlap).
 */
export function ProjectRow({ project, editable, onStatusChange, onOpen }: ProjectRowProps) {
  const subtitle = [project.clientName, project.professionalName].filter(Boolean).join(' · ');

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/8 py-2.5 last:border-b-0">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold uppercase tracking-wide text-ink">{project.projectName}</p>
        {subtitle && <p className="truncate text-xs text-ink-muted">{subtitle}</p>}
      </button>
      <StatusPicker status={project.status} onChange={onStatusChange} disabled={!editable} />
    </div>
  );
}
