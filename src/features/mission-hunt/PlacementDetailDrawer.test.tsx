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
    clientCity: null,
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

describe('PlacementDetailDrawer — privacy hotfix (display-only masking)', () => {
  it('the header shows initials only, never the full professional name', () => {
    render(<PlacementDetailDrawer {...baseProps()} placement={placement({ professionalName: 'Janny Hakkers' })} />);
    expect(screen.getAllByText('J.H.').length).toBeGreaterThan(0);
    expect(screen.queryByText('Janny Hakkers')).not.toBeInTheDocument();
  });

  it('Professional and Klant show the masked value by default, even though the drawer is editable', () => {
    render(<PlacementDetailDrawer {...baseProps()} placement={placement({ professionalName: 'Janny Hakkers', clientName: 'Gemeente Apeldoorn' })} />);
    expect(screen.getAllByText('J.H.').length).toBeGreaterThan(0);
    expect(screen.getByText('Apeldoorn')).toBeInTheDocument();
    expect(screen.queryByText('Janny Hakkers')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Janny Hakkers')).not.toBeInTheDocument();
    expect(screen.queryByText('Gemeente Apeldoorn')).not.toBeInTheDocument();
  });

  it('DB per maand shows the rounded value by default, never the decimal', () => {
    render(<PlacementDetailDrawer {...baseProps()} placement={placement({ monthlyDb: 14.59 })} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('14.59')).not.toBeInTheDocument();
  });

  it('WIJZIG reveals the real, full-precision value for a deliberate edit, and saving writes the real edited value', async () => {
    const user = userEvent.setup();
    const onUpdateField = vi.fn();
    render(<PlacementDetailDrawer {...baseProps()} placement={placement({ professionalName: 'Janny Hakkers' })} onUpdateField={onUpdateField} />);

    const wijzigButtons = screen.getAllByRole('button', { name: /wijzig/i });
    await user.click(wijzigButtons[0]);

    const input = screen.getByDisplayValue('Janny Hakkers');
    await user.clear(input);
    await user.type(input, 'Corrected Name');
    await user.tab();

    expect(onUpdateField).toHaveBeenCalledWith('professionalName', 'Corrected Name');
  });

  it('WIJZIG on DB per maand reveals the real decimal value, not the rounded display value — a blur without editing never corrupts the stored value', async () => {
    const user = userEvent.setup();
    const onUpdateField = vi.fn();
    render(<PlacementDetailDrawer {...baseProps()} placement={placement({ monthlyDb: 14.59 })} onUpdateField={onUpdateField} />);

    const wijzigButtons = screen.getAllByRole('button', { name: /wijzig/i });
    // DB per maand's WIJZIG is the last one rendered (Professional, Klant, DB per maand order).
    await user.click(wijzigButtons[wijzigButtons.length - 1]);

    expect(screen.getByDisplayValue('14.59')).toBeInTheDocument();
    await user.tab();
    expect(onUpdateField).toHaveBeenCalledWith('monthlyDb', 14.59);
  });

  it('Uren per week (FTE) stays fully visible, never masked', () => {
    render(<PlacementDetailDrawer {...baseProps()} placement={placement({ hoursPerWeek: 24 })} />);
    expect(screen.getByDisplayValue('24')).toBeInTheDocument();
  });

  it('a read-only colleague view (not editable) also shows only masked values, never the real names or decimal DB', () => {
    render(<PlacementDetailDrawer {...baseProps()} editable={false} placement={placement({ professionalName: 'Janny Hakkers', clientName: 'Gemeente Apeldoorn', monthlyDb: 14.59 })} />);
    expect(screen.getAllByText('J.H.').length).toBeGreaterThan(0);
    expect(screen.getByText('Apeldoorn')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /wijzig/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Janny Hakkers')).not.toBeInTheDocument();
  });
});
