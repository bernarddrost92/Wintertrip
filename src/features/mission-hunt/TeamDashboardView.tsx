import { useState } from 'react';
import { summarizeTeam, teamTotals } from '../../services/missionHuntAggregate';
import { AgentSummaryCard } from './AgentSummaryCard';
import { AgentDrawer } from './AgentDrawer';
import { StatusFilterBar } from './StatusFilterBar';
import type { MissionHuntProfile, MissionHuntProject, ProjectStatus } from '../../types/missionHunt';

interface TeamDashboardViewProps {
  profiles: MissionHuntProfile[];
  projects: MissionHuntProject[];
  currentUserId: string;
  isAdmin: boolean;
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  onOpenProject: (projectId: string) => void;
}

/**
 * TEAM MISSION HUNT — the Friday-meeting screen. Deliberately just
 * summaries: no project name ever appears at this level (spec section 21).
 * A person's actual projects only ever show up after clicking their card.
 */
export function TeamDashboardView({ profiles, projects, currentUserId, isAdmin, onStatusChange, onOpenProject }: TeamDashboardViewProps) {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const activeProfiles = profiles.filter((p) => p.active);
  const summaries = summarizeTeam(activeProfiles, projects);
  const totals = teamTotals(projects);

  const selectedIndex = selectedUserId ? activeProfiles.findIndex((p) => p.userId === selectedUserId) : -1;
  const selectedSummary = selectedIndex >= 0 ? summaries[selectedIndex] : null;

  function goToOffset(offset: number) {
    if (selectedIndex < 0) return;
    const nextIndex = (selectedIndex + offset + activeProfiles.length) % activeProfiles.length;
    setSelectedUserId(activeProfiles[nextIndex].userId);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="label-classified text-gold/70">Team Mission Hunt</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <TotalTile label="Total Projects" value={totals.total} />
          <TotalTile label="Reviewed" value={totals.total - totals.unreviewed} />
          <TotalTile label="Opportunities" value={totals.opportunity} tone="text-status-go" />
          <TotalTile label="Investigate" value={totals.investigate} tone="text-gold" />
          <TotalTile label="Still Open" value={totals.unreviewed} />
        </div>
      </div>

      <StatusFilterBar value={filter} onChange={setFilter} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((summary) => (
          <AgentSummaryCard key={summary.profile.userId} summary={summary} onClick={() => setSelectedUserId(summary.profile.userId)} />
        ))}
      </div>

      {selectedSummary && (
        <AgentDrawer
          summary={selectedSummary}
          ownProjects={projects.filter((p) => p.ownerId === selectedSummary.profile.userId)}
          editable={isAdmin || selectedSummary.profile.userId === currentUserId}
          initialFilter={filter}
          onClose={() => setSelectedUserId(null)}
          onStatusChange={onStatusChange}
          onOpenProject={onOpenProject}
          onNext={activeProfiles.length > 1 ? () => goToOffset(1) : undefined}
          onPrevious={activeProfiles.length > 1 ? () => goToOffset(-1) : undefined}
        />
      )}
    </div>
  );
}

function TotalTile({ label, value, tone = 'text-ink' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="border border-white/10 bg-mission-raised px-3 py-2.5">
      <p className={`font-display text-2xl font-bold ${tone}`}>{value}</p>
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">{label}</p>
    </div>
  );
}
