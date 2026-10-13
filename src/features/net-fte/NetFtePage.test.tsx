import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FteBon } from '../../services/fteBonnen';
import { NetFtePage } from './NetFtePage';

const { fetchFteBonnen, createFteBon, updateFteBonStatus, deleteFteBon } = vi.hoisted(() => ({
  fetchFteBonnen: vi.fn(),
  createFteBon: vi.fn(),
  updateFteBonStatus: vi.fn(),
  deleteFteBon: vi.fn(),
}));

vi.mock('../../services/fteBonnen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/fteBonnen')>()),
  fetchFteBonnen,
  createFteBon,
  updateFteBonStatus,
  deleteFteBon,
}));

// Pin the official stand to the 13 Oct table so these numbers don't move with each day's snapshot.
vi.mock('../../data/manualPowerBiSnapshot', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/manualPowerBiSnapshot')>();
  return {
    ...actual,
    MANUAL_POWER_BI_SNAPSHOT: {
      updatedAt: '2026-10-13',
      standings: [
        { finalRanking: 1, team: 'Maastricht', vcdbRanking: 3, vcdbScore: 15919.07, placementsInScope: 92, placementsExtraHoursRule: 4, netFteRanking: 1, netFte: 4.05, factor: 2.5, finalScore: 39797.68 },
        { finalRanking: 2, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 22100.91, placementsInScope: 128, placementsExtraHoursRule: 6, netFteRanking: 10, netFte: -7.78, factor: 1.3, finalScore: 28731.19 },
        { finalRanking: 3, team: 'Arnhem', vcdbRanking: 4, vcdbScore: 15716.21, placementsInScope: 125, placementsExtraHoursRule: 5, netFteRanking: 5, netFte: -0.18, factor: 1.4, finalScore: 22002.7 },
        { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 2, vcdbScore: 18657.67, placementsInScope: 136, placementsExtraHoursRule: 8, netFteRanking: 12, netFte: -19.3, factor: 1.0, finalScore: 18657.67 },
        { finalRanking: 5, team: 'Groningen', vcdbRanking: 6, vcdbScore: 11221.16, placementsInScope: 64, placementsExtraHoursRule: 3, netFteRanking: 4, netFte: 0, factor: 1.5, finalScore: 16831.74 },
        { finalRanking: 6, team: 'Alkmaar', vcdbRanking: 5, vcdbScore: 15272.9, placementsInScope: 103, placementsExtraHoursRule: 1, netFteRanking: 11, netFte: -12.7, factor: 1.0, finalScore: 15272.9 },
        { finalRanking: 7, team: 'Eindhoven', vcdbRanking: 7, vcdbScore: 8420.63, placementsInScope: 57, placementsExtraHoursRule: 0, netFteRanking: 7, netFte: -3.55, factor: 1.3, finalScore: 10946.82 },
        { finalRanking: 8, team: 'Breda', vcdbRanking: 10, vcdbScore: 5383.31, placementsInScope: 35, placementsExtraHoursRule: 2, netFteRanking: 2, netFte: 3.05, factor: 2.0, finalScore: 10766.61 },
        { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 8, vcdbScore: 8208.46, placementsInScope: 74, placementsExtraHoursRule: 5, netFteRanking: 8, netFte: -4.9, factor: 1.3, finalScore: 10671.0 },
        { finalRanking: 10, team: 'Middelburg', vcdbRanking: 9, vcdbScore: 6002.33, placementsInScope: 54, placementsExtraHoursRule: 6, netFteRanking: 3, netFte: 2.0, factor: 1.7, finalScore: 10203.97 },
        { finalRanking: 11, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 4670.91, placementsInScope: 45, placementsExtraHoursRule: 1, netFteRanking: 9, netFte: -7.6, factor: 1.3, finalScore: 6072.18 },
      ],
    },
  };
});

function bon(overrides: Partial<FteBon>): FteBon {
  return { id: 'b', label: 'JdV', type: 'VERLENGING', fteDelta: 0.8, owner: null, note: null, status: 'open', createdAt: '2026-10-13T08:00:00Z', ...overrides };
}

describe('NetFtePage', () => {
  beforeEach(() => {
    fetchFteBonnen.mockReset();
    createFteBon.mockReset();
    updateFteBonStatus.mockReset();
    deleteFteBon.mockReset();
  });

  it('shows Zwolle’s official Net FTE, FTE ranking, factor and the FTE mission', async () => {
    fetchFteBonnen.mockResolvedValue([]);
    render(<NetFtePage />);

    expect(screen.getByRole('heading', { name: 'Net FTE' })).toBeInTheDocument();
    const overview = screen.getByText('Officiële Net FTE').closest('div')!.parentElement!;
    expect(within(overview).getByText('-7,78')).toBeInTheDocument();
    expect(within(overview).getByText('#10')).toBeInTheDocument();
    expect(within(overview).getByText('van 12 teams')).toBeInTheDocument();
    expect(within(overview).getByText('1,3x')).toBeInTheDocument();
    expect(screen.getByText(/31 januari 2027 vs 1 september 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Meetdatum')).toBeInTheDocument();
    for (const focus of ['Verlengingen', 'PO → contract', 'BPT verlengen', 'Nieuwe contractanten']) {
      expect(screen.getAllByText(focus).length).toBeGreaterThan(0);
    }
    await screen.findByText(/nog geen open bonnen/i);
  });

  it('FTE Bon Calculator: typing an FTE immediately shows the projected Net FTE, rank and next target', async () => {
    const user = userEvent.setup();
    fetchFteBonnen.mockResolvedValue([]);
    render(<NetFtePage />);

    await user.type(screen.getByLabelText('Groei in FTE'), '1,4');

    const calculator = screen.getByRole('region', { name: /fte bon calculator/i });
    expect(within(calculator).getByText('-6,38')).toBeInTheDocument();
    expect(within(calculator).getByText('#9')).toBeInTheDocument();
    expect(within(calculator).getByText(/voorbij:/i).parentElement).toHaveTextContent('Utrecht');
    expect(within(calculator).getByText(/volgende:/i)).toHaveTextContent('Leeuwarden (#8) · nog +1,49 FTE');
  });

  it('a quick-pick button fills the FTE in one tap', async () => {
    const user = userEvent.setup();
    fetchFteBonnen.mockResolvedValue([]);
    render(<NetFtePage />);

    await user.click(screen.getByRole('button', { name: '+0,5' }));
    expect(screen.getByLabelText('Groei in FTE')).toHaveValue('0,5');
  });

  it('saving a bon adds it to the open list and the projection', async () => {
    const user = userEvent.setup();
    fetchFteBonnen.mockResolvedValue([]);
    createFteBon.mockResolvedValue(bon({ id: 'new', label: 'PvH', type: 'PO_NAAR_CONTRACT', fteDelta: 1.4 }));
    render(<NetFtePage />);
    await screen.findByText(/nog geen open bonnen/i);

    await user.click(screen.getByRole('radio', { name: 'PO → contract' }));
    await user.type(screen.getByLabelText('Groei in FTE'), '1,4');
    await user.type(screen.getByLabelText('Naam / label'), 'PvH');
    await user.type(screen.getByLabelText(/talent manager/i), 'RP');
    await user.click(screen.getByRole('button', { name: /bon opslaan/i }));

    expect(createFteBon).toHaveBeenCalledWith(expect.objectContaining({ label: 'PvH', type: 'PO_NAAR_CONTRACT', fteDelta: 1.4, owner: 'RP' }));
    const list = screen.getByRole('region', { name: /open fte-bonnen/i });
    await waitFor(() => expect(within(list).getByText('PvH')).toBeInTheDocument());
    expect(within(list).getByText('Projectie', { selector: 'p.label-classified' }).parentElement).toHaveTextContent('-6,38');
    expect(within(list).getByText('Verwachte rank', { selector: 'p.label-classified' }).parentElement).toHaveTextContent('#9');
    expect(within(list).getByText('Nog nodig volgende plek', { selector: 'p.label-classified' }).parentElement).toHaveTextContent('+1,49');
    expect(screen.getByLabelText('Groei in FTE')).toHaveValue('');
  });

  it('label and Talent Manager are only needed to save — the calculation works without them', async () => {
    const user = userEvent.setup();
    fetchFteBonnen.mockResolvedValue([]);
    render(<NetFtePage />);
    await user.type(screen.getByLabelText('Groei in FTE'), '1');

    expect(screen.getByRole('button', { name: /bon opslaan/i })).toBeDisabled();
    expect(screen.getByText(/vul nog naam \/ label en talent manager in/i)).toBeInTheDocument();
  });

  it('the Talent Manager is required: a bon without one cannot be saved', async () => {
    const user = userEvent.setup();
    fetchFteBonnen.mockResolvedValue([]);
    render(<NetFtePage />);
    await screen.findByText(/nog geen open bonnen/i);

    expect(screen.getByLabelText(/talent manager/i)).toBeRequired();
    await user.type(screen.getByLabelText('Groei in FTE'), '1');
    await user.type(screen.getByLabelText('Naam / label'), 'PvH');

    expect(screen.getByRole('button', { name: /bon opslaan/i })).toBeDisabled();
    expect(screen.getByText(/vul nog talent manager in/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/talent manager/i), 'RP');
    expect(screen.getByRole('button', { name: /bon opslaan/i })).toBeEnabled();
  });

  it('open bonnen add up; a realised bon leaves the projection', async () => {
    const user = userEvent.setup();
    fetchFteBonnen.mockResolvedValue([bon({ id: 'a', label: 'AB', fteDelta: 0.8 }), bon({ id: 'b', label: 'CD', fteDelta: 0.6 })]);
    updateFteBonStatus.mockResolvedValue(true);
    render(<NetFtePage />);

    const list = screen.getByRole('region', { name: /open fte-bonnen/i });
    await waitFor(() => expect(within(list).getByText('Open FTE-bonnen', { selector: 'p.label-classified' }).parentElement).toHaveTextContent('+1,40'));
    expect(within(list).getByText('Projectie', { selector: 'p.label-classified' }).parentElement).toHaveTextContent('-6,38');

    await user.click(within(list).getAllByRole('button', { name: /gerealiseerd/i })[0]);

    expect(updateFteBonStatus).toHaveBeenCalledWith('a', 'gerealiseerd');
    await waitFor(() => expect(within(list).getByText('Open FTE-bonnen', { selector: 'p.label-classified' }).parentElement).toHaveTextContent('+0,60'));
  });

  it('bonnen unreachable: the calculator still works, saving is disabled with a note', async () => {
    const user = userEvent.setup();
    fetchFteBonnen.mockResolvedValue(null);
    render(<NetFtePage />);
    await screen.findByText(/bonnenlijst is nu niet bereikbaar/i);

    await user.type(screen.getByLabelText('Groei in FTE'), '1,4');
    await user.type(screen.getByLabelText('Naam / label'), 'PvH');

    expect(within(screen.getByRole('region', { name: /fte bon calculator/i })).getByText('-6,38')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bon opslaan/i })).toBeDisabled();
  });

  it('the FTE-ladder shows the next factor tiers and highlights the one that changes the position', async () => {
    fetchFteBonnen.mockResolvedValue([]);
    render(<NetFtePage />);
    await screen.findByText(/nog geen open bonnen/i);

    const ladder = screen.getByRole('region', { name: /fte-ladder/i });
    expect(within(ladder).getByText('1,4x')).toBeInTheDocument();
    expect(within(ladder).getByText('+7,61 FTE')).toBeInTheDocument();
    expect(within(ladder).getByText('+10,84 FTE')).toBeInTheDocument();
    // The 2,0x step (+10,84 FTE) is the first that lifts Zwolle to #1 — highlighted.
    const highlighted = within(ladder).getByText('+10,84 FTE').closest('li')!;
    expect(highlighted.className).toContain('bg-gold/10');
    expect(within(highlighted).getByText('positie #1')).toBeInTheDocument();
    expect(within(ladder).getByText('+7,61 FTE').closest('li')!.className).not.toContain('bg-gold/10');
  });

  it('after saving, "Bonnetje uitdraaien" prints the FTE receipt: professional, contract type, FTE added and the total FTE stand', async () => {
    const user = userEvent.setup();
    fetchFteBonnen.mockResolvedValue([]);
    createFteBon.mockResolvedValue(bon({ id: 'new', label: 'P. van Heerde', type: 'PO_NAAR_CONTRACT', fteDelta: 1.4, owner: 'BD' }));
    render(<NetFtePage />);
    await screen.findByText(/nog geen open bonnen/i);

    await user.click(screen.getByRole('radio', { name: 'PO → contract' }));
    await user.type(screen.getByLabelText('Groei in FTE'), '1,4');
    await user.type(screen.getByLabelText('Naam / label'), 'P. van Heerde');
    await user.type(screen.getByLabelText(/talent manager/i), 'BD');
    await user.click(screen.getByRole('button', { name: /bon opslaan/i }));
    await user.click(await screen.findByRole('button', { name: /bonnetje uitdraaien/i }));

    const receipt = within(screen.getByRole('dialog', { name: /fte-bonnetje p\. van heerde/i }));
    expect(receipt.getByText('FTE Receipt')).toBeInTheDocument();
    expect(receipt.getByText('P. van Heerde')).toBeInTheDocument();
    expect(receipt.getByText('PO → contract')).toBeInTheDocument();
    expect(receipt.getByText('BD')).toBeInTheDocument();
    expect(receipt.getByText(/totale fte-stand zwolle/i).nextElementSibling).toHaveTextContent('-6,38');
    expect(receipt.getByText('Deze bon').nextElementSibling).toHaveTextContent('+1,40');
    expect(receipt.getByText('FTE-rank').nextElementSibling).toHaveTextContent('#10 → #9');
    expect(receipt.getByText('Meetdatum').nextElementSibling).toHaveTextContent('31 JAN 2027');
    expect(receipt.getByText('vs startmeting').nextElementSibling).toHaveTextContent('01 SEP 2026');
    expect(receipt.getByRole('button', { name: /download bonnetje/i })).toBeInTheDocument();
  });

  it('every bon in the list can print its receipt; with other open bonnen it also shows the stand with all of them', async () => {
    const user = userEvent.setup();
    fetchFteBonnen.mockResolvedValue([bon({ id: 'a', label: 'AB', fteDelta: 0.8 }), bon({ id: 'b', label: 'CD', type: 'NIEUWE_CONTRACTANT', fteDelta: 0.6 })]);
    render(<NetFtePage />);
    const list = screen.getByRole('region', { name: /open fte-bonnen/i });
    await within(list).findByText('CD');

    await user.click(within(list).getAllByRole('button', { name: /bonnetje/i })[1]);

    const receipt = within(screen.getByRole('dialog', { name: /fte-bonnetje cd/i }));
    expect(receipt.getByText('Nieuwe contractant')).toBeInTheDocument();
    expect(receipt.getByText(/totale fte-stand zwolle/i).nextElementSibling).toHaveTextContent('-7,18');
    expect(receipt.getByText('Met alle open bonnen').nextElementSibling).toHaveTextContent('-6,38');
  });

  it('the receipt closes with Sluiten or Escape', async () => {
    const user = userEvent.setup();
    fetchFteBonnen.mockResolvedValue([bon({ id: 'a', label: 'AB', fteDelta: 0.8 })]);
    render(<NetFtePage />);
    const list = screen.getByRole('region', { name: /open fte-bonnen/i });
    await within(list).findByText('AB');

    await user.click(within(list).getByRole('button', { name: /bonnetje/i }));
    await user.click(screen.getByRole('button', { name: /sluiten/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(within(list).getByRole('button', { name: /bonnetje/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
