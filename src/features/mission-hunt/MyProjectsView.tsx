import { useState } from 'react';
import { Plus } from 'lucide-react';
import { GoldButton } from '../../components/GoldButton';
import { ImportPanel } from './ImportPanel';
import { AddProjectForm } from './AddProjectForm';
import { ProjectRow } from './ProjectRow';
import type { ImportPreview } from '../../services/missionHuntImportPreview';
import type { MissionHuntProfile, MissionHuntProject, NewProjectInput, ProjectStatus } from '../../types/missionHunt';

interface MyProjectsViewProps {
  profile: MissionHuntProfile;
  projects: MissionHuntProject[];
  existingFingerprints: ReadonlySet<string>;
  onAdd: (input: NewProjectInput) => Promise<void> | void;
  onImport: (preview: ImportPreview) => Promise<{ ok: true; count: number } | { ok: false; error: string }>;
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onOpenProject: (projectId: string) => void;
}

/** MY PROJECTS: the owner's own working view — import, add, and scan/triage
 * their own list. Never shows a colleague's projects (that's the Team
 * Dashboard's job, and only after clicking into that person). */
export function MyProjectsView({ profile, projects, existingFingerprints, onAdd, onImport, onStatusChange, onOpenProject }: MyProjectsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const reviewed = projects.filter((p) => p.status !== 'unreviewed').length;
  const open = projects.length - reviewed;
  const percent = projects.length === 0 ? 100 : Math.round((reviewed / projects.length) * 100);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-ink">{profile.displayName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">
          <span className="text-ink">{projects.length} PROJECTS</span>
          <span>{reviewed} REVIEWED</span>
          <span>{open} OPEN</span>
        </div>
        <div className="mt-3 max-w-xs">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-gold/80">
            <span>Mission Review</span>
            <span>{percent}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-white/10">
            <div className="h-full bg-gold-sweep transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <ImportPanel ownerId={profile.userId} existingFingerprints={existingFingerprints} onImport={onImport} />

      {showAddForm ? (
        <AddProjectForm
          onAdd={async (input) => {
            await onAdd(input);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <GoldButton type="button" variant="ghost" icon={<Plus size={14} />} onClick={() => setShowAddForm(true)} className="self-start !px-3 !py-2 !text-xs">
          Add Project
        </GoldButton>
      )}

      <div>
        {projects.length === 0 ? (
          <p className="border border-dashed border-white/15 px-4 py-8 text-center text-sm text-ink-muted">
            Nog geen projecten. Importeer een Excel-bestand of voeg er handmatig één toe.
          </p>
        ) : (
          projects.map((project) => (
            <ProjectRow key={project.id} project={project} editable onStatusChange={(status) => onStatusChange(project.id, status)} onOpen={() => onOpenProject(project.id)} />
          ))
        )}
      </div>
    </div>
  );
}
