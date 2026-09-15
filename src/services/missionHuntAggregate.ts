import type { MissionHuntProfile, MissionHuntProject, ProjectStatus } from '../types/missionHunt';

export interface StatusCounts {
  total: number;
  opportunity: number;
  investigate: number;
  noAction: number;
  unreviewed: number;
}

function countByStatus(projects: MissionHuntProject[]): StatusCounts {
  const counts: StatusCounts = { total: projects.length, opportunity: 0, investigate: 0, noAction: 0, unreviewed: 0 };
  for (const project of projects) {
    if (project.status === 'opportunity') counts.opportunity += 1;
    else if (project.status === 'investigate') counts.investigate += 1;
    else if (project.status === 'no_action') counts.noAction += 1;
    else counts.unreviewed += 1;
  }
  return counts;
}

/** 100 for a person/team with zero projects — nothing to review is complete
 * review, not a division-by-zero placeholder. */
export function completionPercent(counts: StatusCounts): number {
  if (counts.total === 0) return 100;
  const reviewed = counts.total - counts.unreviewed;
  return Math.round((reviewed / counts.total) * 100);
}

export interface AgentSummary {
  profile: MissionHuntProfile;
  counts: StatusCounts;
  reviewPercent: number;
  isComplete: boolean;
}

/** Homework is "done" only at 100% review — a rounded 99% must never read as
 * finished, so this checks the unrounded unreviewed count, not the percent. */
export function summarizeAgent(profile: MissionHuntProfile, projects: MissionHuntProject[]): AgentSummary {
  const ownProjects = projects.filter((p) => p.ownerId === profile.userId);
  const counts = countByStatus(ownProjects);
  return {
    profile,
    counts,
    reviewPercent: completionPercent(counts),
    isComplete: counts.unreviewed === 0,
  };
}

export function summarizeTeam(profiles: MissionHuntProfile[], projects: MissionHuntProject[]): AgentSummary[] {
  return profiles.map((profile) => summarizeAgent(profile, projects));
}

export function teamTotals(projects: MissionHuntProject[]): StatusCounts {
  return countByStatus(projects);
}

export function filterProjectsByStatus(projects: MissionHuntProject[], status: ProjectStatus | 'all'): MissionHuntProject[] {
  if (status === 'all') return projects;
  return projects.filter((p) => p.status === status);
}
