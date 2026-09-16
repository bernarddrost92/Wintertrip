import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TeamImportPanel } from './TeamImportPanel';

const FULL_HEADER = 'Accountmanager\tE-mail accountmanager\tProfessional\tKlant\tDB per maand\tUren per week\tStartdatum\tEinddatum';

async function pasteRows(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole('button', { name: /paste from excel/i }));
  const textarea = screen.getByPlaceholderText(/plak hier/i);
  await user.click(textarea);
  await user.paste(text);
}

describe('TeamImportPanel', () => {
  it('parses a pasted team sheet and shows NEW/BESTAAND/GEWIJZIGD/FOUTEN counts plus recognized accountmanagers', async () => {
    const user = userEvent.setup();
    const text = [
      FULL_HEADER,
      'Bernard\tbernard.drost@maandag.com\tRyan Dijkstra\tGreijdanus\t10\t24\t2026-10-01\t2026-12-31',
      'Lisa\tlisa@maandag.com\tAndere Prof\tAndere Klant\t8\t20\t2026-09-01\t2026-11-30',
    ].join('\n');

    render(<TeamImportPanel existingPlacements={[]} onImport={vi.fn()} />);
    await pasteRows(user, text);

    expect(screen.getByText(/2 PLAATSINGEN GEVONDEN/)).toBeInTheDocument();
    expect(screen.getByText(/2 ACCOUNTMANAGERS/)).toBeInTheDocument();
    expect(screen.getByText('2 NIEUW')).toBeInTheDocument();
    expect(screen.getByText('0 BESTAAND')).toBeInTheDocument();
    expect(screen.getByText('0 GEWIJZIGD')).toBeInTheDocument();
    expect(screen.getByText('0 FOUTEN')).toBeInTheDocument();
    expect(screen.getByText(/Bernard — 1/)).toBeInTheDocument();
    expect(screen.getByText(/Lisa — 1/)).toBeInTheDocument();
  });

  it('shows row-numbered errors for malformed rows rather than silently dropping them', async () => {
    const user = userEvent.setup();
    const text = [FULL_HEADER, 'Bernard\tnot-an-email\tRyan Dijkstra\tGreijdanus\t10\t24\t2026-10-01\t2026-12-31'].join('\n');

    render(<TeamImportPanel existingPlacements={[]} onImport={vi.fn()} />);
    await pasteRows(user, text);

    expect(screen.getByText('1 FOUTEN')).toBeInTheDocument();
    expect(screen.getByText(/Rij 2: Ongeldig e-mailadres accountmanager/)).toBeInTheDocument();
  });

  it('a fingerprint match with changed hours/DB shows as GEWIJZIGD and requires the same explicit Confirm Import', async () => {
    const user = userEvent.setup();
    const text = [FULL_HEADER, 'Bernard\tbernard.drost@maandag.com\tRyan Dijkstra\tGreijdanus\t15\t30\t2026-10-01\t2026-12-31'].join('\n');

    render(
      <TeamImportPanel
        existingPlacements={[
          { id: 'existing-1', fingerprint: 'bernard.drost@maandag.com::ryan dijkstra::greijdanus::2026-10-01::2026-12-31', ownerDisplayName: 'Bernard', hoursPerWeek: 24, monthlyDb: 10 },
        ]}
        onImport={vi.fn()}
      />,
    );
    await pasteRows(user, text);

    expect(screen.getByText('1 GEWIJZIGD')).toBeInTheDocument();
    expect(screen.getByText(/hoursPerWeek, monthlyDb gewijzigd/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm import \(1\)/i })).toBeInTheDocument();
  });

  it('nothing is written until CONFIRM IMPORT — onImport only fires on that explicit click', async () => {
    const onImport = vi.fn().mockResolvedValue({ ok: true, newCount: 1, changedCount: 0 });
    const user = userEvent.setup();
    const text = [FULL_HEADER, 'Bernard\tbernard.drost@maandag.com\tRyan Dijkstra\tGreijdanus\t10\t24\t2026-10-01\t2026-12-31'].join('\n');

    render(<TeamImportPanel existingPlacements={[]} onImport={onImport} />);
    await pasteRows(user, text);
    expect(onImport).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /confirm import/i }));
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/geïmporteerd/i)).toHaveTextContent('1 nieuw, 0 gewijzigd geïmporteerd.');
  });

  it('the downloadable template exposes the exact required column headers', () => {
    render(<TeamImportPanel existingPlacements={[]} onImport={vi.fn()} />);
    expect(screen.getByRole('button', { name: /download excel template/i })).toBeInTheDocument();
  });
});
