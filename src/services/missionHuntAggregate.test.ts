import { describe, expect, it } from 'vitest';
import { completionPercent, filterProjectsByStatus, summarizeAgent, summarizeTeam, teamTotals } from './missionHuntAggregate';
import type { MissionHuntProfile, MissionHuntProject, ProjectStatus } from '../types/missionHunt';

function profile(overrides: Partial<MissionHuntProfile> = {}): MissionHuntProfile {
  return {
    id: 'p-1',
    userId: 'user-1',
    displayName: 'Bernard',
    role: 'member',
    active: true,
    createdAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

function project(ownerId: string, status: ProjectStatus, overrides: Partial<MissionHuntProject> = {}): MissionHuntProject {
  return {
    id: `proj-${Math.random()}`,
    ownerId,
    projectName: 'Project X',
    clientName: 'Client X',
    professionalName: null,
    startDate: null,
    endDate: null,
    hoursPerWeek: null,
    monthlyVcdb: null,
    note: null,
    status,
    opportunityTypes: [],
    fingerprint: 'fp',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('completionPercent', () => {
  it('is 100 for zero projects (nothing to review is complete review)', () => {
    expect(completionPercent({ total: 0, opportunity: 0, investigate: 0, noAction: 0, unreviewed: 0 })).toBe(100);
  });

  it('rounds the reviewed fraction', () => {
    expect(completionPercent({ total: 4, opportunity: 1, investigate: 1, noAction: 1, unreviewed: 1 })).toBe(75);
  });

  it('is 0 when everything is still unreviewed', () => {
    expect(completionPercent({ total: 3, opportunity: 0, investigate: 0, noAction: 0, unreviewed: 3 })).toBe(0);
  });
});

describe('summarizeAgent', () => {
  it('counts only that agent\'s own projects, and flags completion exactly at zero unreviewed', () => {
    const bernard = profile({ userId: 'user-1', displayName: 'Bernard' });
    const projects = [
      project('user-1', 'opportunity'),
      project('user-1', 'investigate'),
      project('user-2', 'unreviewed'), // a colleague's project — must not count for Bernard
    ];

    const summary = summarizeAgent(bernard, projects);
    expect(summary.counts.total).toBe(2);
    expect(summary.counts.opportunity).toBe(1);
    expect(summary.counts.investigate).toBe(1);
    expect(summary.counts.unreviewed).toBe(0);
    expect(summary.isComplete).toBe(true);
    expect(summary.reviewPercent).toBe(100);
  });

  it('is not complete while any project is unreviewed, even at a rounded 99%+', () => {
    const jurgen = profile({ userId: 'user-2', displayName: 'Jurgen' });
    const projects = Array.from({ length: 99 }, () => project('user-2', 'opportunity')).concat([project('user-2', 'unreviewed')]);
    const summary = summarizeAgent(jurgen, projects);
    expect(summary.reviewPercent).toBe(99);
    expect(summary.isComplete).toBe(false);
  });
});

describe('summarizeTeam', () => {
  it('produces one summary per profile, independent of project array order', () => {
    const profiles = [profile({ userId: 'u1', displayName: 'Bernard' }), profile({ userId: 'u2', displayName: 'Jurgen' })];
    const projects = [project('u2', 'opportunity'), project('u1', 'no_action')];
    const summaries = summarizeTeam(profiles, projects);
    expect(summaries).toHaveLength(2);
    expect(summaries[0].profile.displayName).toBe('Bernard');
    expect(summaries[0].counts.noAction).toBe(1);
    expect(summaries[1].profile.displayName).toBe('Jurgen');
    expect(summaries[1].counts.opportunity).toBe(1);
  });
});

describe('teamTotals', () => {
  it('aggregates across every project regardless of owner', () => {
    const projects = [project('u1', 'opportunity'), project('u2', 'opportunity'), project('u1', 'investigate'), project('u2', 'unreviewed')];
    const totals = teamTotals(projects);
    expect(totals).toEqual({ total: 4, opportunity: 2, investigate: 1, noAction: 0, unreviewed: 1 });
  });
});

describe('filterProjectsByStatus', () => {
  it('"all" returns every project unfiltered', () => {
    const projects = [project('u1', 'opportunity'), project('u1', 'no_action')];
    expect(filterProjectsByStatus(projects, 'all')).toHaveLength(2);
  });

  it('a specific status returns only matching projects', () => {
    const projects = [project('u1', 'opportunity'), project('u1', 'no_action'), project('u1', 'opportunity')];
    expect(filterProjectsByStatus(projects, 'opportunity')).toHaveLength(2);
  });
});
