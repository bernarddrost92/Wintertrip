import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectRow } from './ProjectRow';
import type { MissionHuntProject } from '../../types/missionHunt';

function project(overrides: Partial<MissionHuntProject> = {}): MissionHuntProject {
  return {
    id: 'proj-1',
    ownerId: 'user-1',
    projectName: 'De Meerwaarde',
    clientName: 'Han',
    professionalName: 'docent Nederlands',
    startDate: null,
    endDate: null,
    hoursPerWeek: null,
    monthlyVcdb: null,
    note: null,
    status: 'unreviewed',
    opportunityTypes: [],
    fingerprint: 'fp',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('ProjectRow — permissions', () => {
  it('a member can change the status of their own project (editable)', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    render(<ProjectRow project={project()} editable onStatusChange={onStatusChange} onOpen={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /nog beoordelen/i }));
    await user.click(screen.getByRole('menuitem', { name: /kans/i }));
    expect(onStatusChange).toHaveBeenCalledWith('opportunity');
  });

  it("a member cannot change a colleague's project — status renders read-only, not clickable", () => {
    render(<ProjectRow project={project()} editable={false} onStatusChange={vi.fn()} onOpen={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /nog beoordelen/i })).not.toBeInTheDocument();
    expect(screen.getByText(/nog beoordelen/i)).toBeInTheDocument();
  });

  it('clicking the project name/subtitle opens the detail view', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<ProjectRow project={project()} editable onStatusChange={vi.fn()} onOpen={onOpen} />);

    await user.click(screen.getByText('De Meerwaarde'));
    expect(onOpen).toHaveBeenCalled();
  });

  it('shows client and professional as a compact subtitle', () => {
    render(<ProjectRow project={project()} editable onStatusChange={vi.fn()} onOpen={vi.fn()} />);
    expect(screen.getByText('Han · docent Nederlands')).toBeInTheDocument();
  });
});
