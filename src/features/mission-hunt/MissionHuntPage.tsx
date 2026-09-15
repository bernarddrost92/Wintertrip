import { useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { SetupRequiredNotice } from './SetupRequiredNotice';
import { MissionHuntAuthProvider } from './MissionHuntAuthProvider';
import { useMissionHuntAuth } from './missionHuntAuthContext';
import { AuthGate } from './AuthGate';
import { GoldButton } from '../../components/GoldButton';
import { useMissionHuntData } from './useMissionHuntData';
import { MyProjectsView } from './MyProjectsView';
import { TeamDashboardView } from './TeamDashboardView';
import { ProjectDetailDrawer } from './ProjectDetailDrawer';
import { canEditProject } from '../../services/missionHuntPermissions';
import type { ImportPreview } from '../../services/missionHuntImportPreview';

interface MissionHuntPageProps {
  onNavigateToCalculator: () => void;
}

type Tab = 'my-projects' | 'team-dashboard';

export function MissionHuntPage({ onNavigateToCalculator }: MissionHuntPageProps) {
  if (!isSupabaseConfigured()) return <SetupRequiredNotice />;

  return (
    <MissionHuntAuthProvider>
      <MissionHuntShell onNavigateToCalculator={onNavigateToCalculator} />
    </MissionHuntAuthProvider>
  );
}

function MissionHuntShell({ onNavigateToCalculator }: MissionHuntPageProps) {
  const { status, profile, errorMessage, signOut, retry } = useMissionHuntAuth();

  if (status === 'loading') {
    return (
      <div className="px-4 py-20 text-center">
        <p className="label-classified text-gold/70">Mission Hunt</p>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Authenticating agent…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <p className="label-classified text-gold/70">Mission Hunt</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-wide text-ink">System Error</h1>
        <p className="mt-4 text-sm text-ink-muted">{errorMessage ?? 'Mission intelligence kon niet worden geladen.'}</p>
        <GoldButton type="button" onClick={retry} className="mt-8">
          Retry
        </GoldButton>
      </div>
    );
  }

  if (status !== 'signed_in' || !profile) {
    return <AuthGate />;
  }

  return <MissionHuntDashboard profile={profile} onSignOut={signOut} onNavigateToCalculator={onNavigateToCalculator} />;
}

function MissionHuntDashboard({
  profile,
  onSignOut,
  onNavigateToCalculator,
}: {
  profile: NonNullable<ReturnType<typeof useMissionHuntAuth>['profile']>;
  onSignOut: () => void;
  onNavigateToCalculator: () => void;
}) {
  const data = useMissionHuntData(profile.userId);
  const [tab, setTab] = useState<Tab>('my-projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const ownProjects = data.projects.filter((p) => p.ownerId === profile.userId);
  const selectedProject = selectedProjectId ? data.projects.find((p) => p.id === selectedProjectId) ?? null : null;
  const selectedProjectOwner = selectedProject ? data.profiles.find((p) => p.userId === selectedProject.ownerId) : null;

  async function handleImport(preview: ImportPreview) {
    return data.importProjects(preview.newRows);
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-classified text-gold/70">007 · Project Intelligence</p>
          <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-wide text-ink sm:text-4xl">Mission Hunt</h1>
        </div>
        <button type="button" onClick={onSignOut} className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted underline hover:text-gold">
          Uitloggen ({profile.displayName})
        </button>
      </div>

      <div className="mt-6 flex gap-1 border-b border-white/10">
        <TabButton label="My Projects" active={tab === 'my-projects'} onClick={() => setTab('my-projects')} />
        <TabButton label="Team Dashboard" active={tab === 'team-dashboard'} onClick={() => setTab('team-dashboard')} />
      </div>

      {data.loading && <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Loading project intelligence…</p>}
      {data.error && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <p className="text-sm text-red-400">{data.error}</p>
          <GoldButton type="button" variant="subtle" onClick={data.refresh} className="!px-3 !py-1.5 !text-xs">
            Retry
          </GoldButton>
        </div>
      )}

      {!data.loading && !data.error && (
        <div className="mt-6">
          {tab === 'my-projects' ? (
            <MyProjectsView
              profile={profile}
              projects={ownProjects}
              existingFingerprints={data.existingFingerprints()}
              onAdd={async (input) => {
                await data.addProject(input);
              }}
              onImport={handleImport}
              onStatusChange={data.updateProjectStatus}
              onOpenProject={setSelectedProjectId}
            />
          ) : (
            <TeamDashboardView
              profiles={data.profiles}
              projects={data.projects}
              currentUserId={profile.userId}
              isAdmin={profile.role === 'admin'}
              onStatusChange={data.updateProjectStatus}
              onOpenProject={setSelectedProjectId}
            />
          )}
        </div>
      )}

      {selectedProject && (
        <ProjectDetailDrawer
          project={selectedProject}
          ownerName={selectedProjectOwner?.displayName ?? '—'}
          editable={canEditProject(selectedProject, profile.userId, profile.role)}
          onClose={() => setSelectedProjectId(null)}
          onUpdateField={(field, value) => data.updateProjectFields(selectedProject.id, { [field]: value })}
          onUpdateStatus={(status) => data.updateProjectStatus(selectedProject.id, status)}
          onUpdateOpportunityTypes={(types) => data.updateProjectOpportunityTypes(selectedProject.id, types)}
          onDelete={() => {
            data.deleteProject(selectedProject.id);
            setSelectedProjectId(null);
          }}
          onCalculateOpportunity={onNavigateToCalculator}
        />
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`border-b-2 px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.12em] transition-colors duration-150 ${
        active ? 'border-gold text-gold' : 'border-transparent text-ink-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}
