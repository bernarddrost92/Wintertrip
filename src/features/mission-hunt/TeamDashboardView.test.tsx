import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TeamDashboardView } from './TeamDashboardView';
import type { MissionHuntProfile, MissionHuntProject } from '../../types/missionHunt';

function profile(overrides: Partial<MissionHuntProfile> = {}): MissionHuntProfile {
  return { id: 'p', userId: 'u1', displayName: 'Bernard', role: 'member', active: true, createdAt: '2026-09-01T00:00:00Z', ...overrides };
}

function project(ownerId: string, status: MissionHuntProject['status'], name: string): MissionHuntProject {
  return {
    id: `${ownerId}-${name}`,
    ownerId,
    projectName: name,
    clientName: 'Client',
    professionalName: null,
    startDate: null,
    endDate: null,
    hoursPerWeek: null,
    monthlyVcdb: null,
    note: null,
    status,
    opportunityTypes: [],
    fingerprint: `${ownerId}-${name}`,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };
}

describe('TeamDashboardView — team totals and per-person counts', () => {
  it('shows correct team totals across every profile', () => {
    const profiles = [profile({ userId: 'u1', displayName: 'Bernard' }), profile({ userId: 'u2', displayName: 'Jurgen' })];
    const projects = [project('u1', 'opportunity', 'Alpha'), project('u1', 'unreviewed', 'Beta'), project('u2', 'investigate', 'Gamma')];

    render(<TeamDashboardView profiles={profiles} projects={projects} currentUserId="u1" isAdmin={false} onStatusChange={vi.fn()} onOpenProject={vi.fn()} />);

    expect(screen.getByText('3')).toBeInTheDocument(); // TOTAL PROJECTS
    expect(screen.getByText('Bernard')).toBeInTheDocument();
    expect(screen.getByText('Jurgen')).toBeInTheDocument();
  });

  it('never shows a project name at the top level — only clicking a person reveals them', () => {
    const profiles = [profile({ userId: 'u1', displayName: 'Bernard' })];
    const projects = [project('u1', 'opportunity', 'De Meerwaarde')];

    render(<TeamDashboardView profiles={profiles} projects={projects} currentUserId="u1" isAdmin={false} onStatusChange={vi.fn()} onOpenProject={vi.fn()} />);

    expect(screen.queryByText('De Meerwaarde')).not.toBeInTheDocument();
  });
});

describe('TeamDashboardView — clicking a person reveals only their projects', () => {
  it('opens a drawer with that person\'s project names, not anyone else\'s', async () => {
    const user = userEvent.setup();
    const profiles = [profile({ userId: 'u1', displayName: 'Bernard' }), profile({ userId: 'u2', displayName: 'Jurgen' })];
    const projects = [project('u1', 'opportunity', 'Bernard Project'), project('u2', 'opportunity', 'Jurgen Project')];

    render(<TeamDashboardView profiles={profiles} projects={projects} currentUserId="u1" isAdmin={false} onStatusChange={vi.fn()} onOpenProject={vi.fn()} />);

    expect(screen.queryByText('Bernard Project')).not.toBeInTheDocument();

    await user.click(screen.getByText('Bernard'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Bernard Project')).toBeInTheDocument();
    expect(screen.queryByText('Jurgen Project')).not.toBeInTheDocument();
  });

  it('a colleague\'s project row inside the drawer is read-only', async () => {
    const user = userEvent.setup();
    const profiles = [profile({ userId: 'u1', displayName: 'Bernard' }), profile({ userId: 'u2', displayName: 'Jurgen' })];
    const projects = [project('u2', 'opportunity', 'Jurgen Project')];

    render(<TeamDashboardView profiles={profiles} projects={projects} currentUserId="u1" isAdmin={false} onStatusChange={vi.fn()} onOpenProject={vi.fn()} />);

    await user.click(screen.getByText('Jurgen'));
    // The drawer's own status FILTER chip ("🟢 KANS", emoji included in its
    // name) still renders — only the per-row StatusPicker TRIGGER (name is
    // exactly "KANS", its emoji is aria-hidden) must be absent when read-only.
    expect(screen.queryByRole('button', { name: 'KANS' })).not.toBeInTheDocument();
  });

  it('an admin can edit a colleague\'s project from the drawer', async () => {
    const user = userEvent.setup();
    const profiles = [profile({ userId: 'u1', displayName: 'Admin' }), profile({ userId: 'u2', displayName: 'Jurgen' })];
    const projects = [project('u2', 'opportunity', 'Jurgen Project')];

    render(<TeamDashboardView profiles={profiles} projects={projects} currentUserId="u1" isAdmin onStatusChange={vi.fn()} onOpenProject={vi.fn()} />);

    await user.click(screen.getByText('Jurgen'));
    expect(screen.getByRole('button', { name: 'KANS' })).toBeInTheDocument();
  });
});

describe('TeamDashboardView — filters', () => {
  it('the status filter bar is present for scanning one status at a time', () => {
    render(<TeamDashboardView profiles={[]} projects={[]} currentUserId="u1" isAdmin={false} onStatusChange={vi.fn()} onOpenProject={vi.fn()} />);
    expect(screen.getByRole('group', { name: /filter op status/i })).toBeInTheDocument();
  });
});
