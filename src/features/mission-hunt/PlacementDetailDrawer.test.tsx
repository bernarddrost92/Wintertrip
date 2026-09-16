import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlacementDetailDrawer } from './PlacementDetailDrawer';
import type { MissionHuntPlacement, TalentManagerLink } from '../../types/missionHunt';

function placement(overrides: Partial<MissionHuntPlacement> = {}): MissionHuntPlacement {
  return {
    id: 'pl-1',
    ownerId: 'user-1',
    ownerEmail: 'bernard.drost@maandag.com',
    ownerDisplayName: 'Bernard',
    professionalName: 'Ryan Dijkstra',
    clientName: 'Greijdanus',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    hoursPerWeek: 24,
    monthlyDb: 10,
    note: null,
    fingerprint: 'fp',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

function baseProps() {
  return {
    placement: placement(),
    editable: true,
    canReassign: false,
    talentManagerLinks: [] as TalentManagerLink[],
    canManageTalentManagers: false,
    knownTalentManagerOptions: [],
    onClose: vi.fn(),
    onUpdateField: vi.fn(),
    onReassign: vi.fn(),
    onUpdateTalentManagers: vi.fn(),
    onDelete: vi.fn(),
  };
}

describe('PlacementDetailDrawer — Talent Manager assignment', () => {
  it('a non-admin sees the linked Talent Managers as read-only text, never checkboxes', () => {
    const links: TalentManagerLink[] = [{ id: 'l1', projectId: 'pl-1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' }];
    render(<PlacementDetailDrawer {...baseProps()} canManageTalentManagers={false} talentManagerLinks={links} />);

    expect(screen.getByText('Kim')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('a non-admin with no linked TM sees "Geen talent manager gekoppeld"', () => {
    render(<PlacementDetailDrawer {...baseProps()} canManageTalentManagers={false} talentManagerLinks={[]} />);
    expect(screen.getByText(/geen talent manager gekoppeld/i)).toBeInTheDocument();
  });

  it('an admin sees a checkbox for every known Talent Manager, pre-checked for those already linked', () => {
    const links: TalentManagerLink[] = [{ id: 'l1', projectId: 'pl-1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' }];
    render(
      <PlacementDetailDrawer
        {...baseProps()}
        canManageTalentManagers
        talentManagerLinks={links}
        knownTalentManagerOptions={[
          { email: 'kim.schuring@maandag.com', displayName: 'Kim' },
          { email: 'monique.schulten@maandag.com', displayName: 'Monique' },
        ]}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Kim' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Monique' })).not.toBeChecked();
  });

  it('toggling checkboxes does not write until Toewijzing opslaan is clicked', async () => {
    const user = userEvent.setup();
    const onUpdateTalentManagers = vi.fn();
    render(
      <PlacementDetailDrawer
        {...baseProps()}
        canManageTalentManagers
        onUpdateTalentManagers={onUpdateTalentManagers}
        knownTalentManagerOptions={[{ email: 'kim.schuring@maandag.com', displayName: 'Kim' }]}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Kim' }));
    expect(onUpdateTalentManagers).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /toewijzing opslaan/i }));
    expect(onUpdateTalentManagers).toHaveBeenCalledWith(['kim.schuring@maandag.com'], ['Kim']);
  });

  it('an admin can add a Talent Manager not previously known, by email', async () => {
    const user = userEvent.setup();
    const onUpdateTalentManagers = vi.fn();
    render(<PlacementDetailDrawer {...baseProps()} canManageTalentManagers onUpdateTalentManagers={onUpdateTalentManagers} />);

    await user.type(screen.getByLabelText(/naam \(nieuw\)/i), 'Huub');
    await user.type(screen.getByLabelText(/e-mailadres \(nieuw\)/i), 'huub.hoiting@maandag.com');
    await user.click(screen.getByRole('button', { name: /toevoegen/i }));
    await user.click(screen.getByRole('button', { name: /toewijzing opslaan/i }));

    expect(onUpdateTalentManagers).toHaveBeenCalledWith(['huub.hoiting@maandag.com'], ['Huub']);
  });

  it('unchecking a previously linked TM and saving sends the reduced set — deselection is explicit, not silent', async () => {
    const user = userEvent.setup();
    const onUpdateTalentManagers = vi.fn();
    const links: TalentManagerLink[] = [{ id: 'l1', projectId: 'pl-1', talentManagerEmail: 'kim.schuring@maandag.com', talentManagerId: null, talentManagerDisplayName: 'Kim', createdAt: 'x' }];
    render(
      <PlacementDetailDrawer
        {...baseProps()}
        canManageTalentManagers
        talentManagerLinks={links}
        onUpdateTalentManagers={onUpdateTalentManagers}
        knownTalentManagerOptions={[{ email: 'kim.schuring@maandag.com', displayName: 'Kim' }]}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Kim' }));
    await user.click(screen.getByRole('button', { name: /toewijzing opslaan/i }));
    expect(onUpdateTalentManagers).toHaveBeenCalledWith([], []);
  });
});
