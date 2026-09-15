import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as XLSX from 'xlsx';
import { describe, expect, it, vi } from 'vitest';
import { ImportPanel } from './ImportPanel';
import { buildProjectFingerprint } from '../../services/missionHuntFingerprint';
import { buildTemplateWorkbook, TEMPLATE_SHEET_NAME } from '../../services/missionHuntExcelTemplate';

const PASTE_HEADER = 'Project\tKlant\tProfessional';

/** fireEvent.change (not user.type) — user-event's type() interprets a raw
 * tab character in the string as a real Tab keypress (focus-shift) rather
 * than pasted text, which would break these tab-separated fixtures. */
function pasteInto(textarea: HTMLElement, value: string) {
  fireEvent.change(textarea, { target: { value } });
}

describe('ImportPanel — paste from Excel', () => {
  it('parses pasted rows and shows a preview before importing anything', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue({ ok: true, count: 2 });
    render(<ImportPanel ownerId="owner-1" existingFingerprints={new Set()} onImport={onImport} />);

    await user.click(screen.getByRole('button', { name: /paste from excel/i }));
    pasteInto(screen.getByPlaceholderText(/plak hier/i), `${PASTE_HEADER}\nDe Meerwaarde\tHan\tdocent Nederlands\nGreijdanus\tRyan\tEconomie`);
    await user.click(screen.getByRole('button', { name: /verwerken/i }));

    expect(screen.getByText(/2 projects found/i)).toBeInTheDocument();
    expect(screen.getByText(/2 new/i)).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
  });
});

describe('ImportPanel — duplicate detection', () => {
  it('a row matching an existing fingerprint is counted as ALREADY EXISTS, not NEW', async () => {
    const user = userEvent.setup();
    const existing = new Set([buildProjectFingerprint('owner-1', 'De Meerwaarde', 'Han', 'docent Nederlands')]);
    render(<ImportPanel ownerId="owner-1" existingFingerprints={existing} onImport={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /paste from excel/i }));
    pasteInto(screen.getByPlaceholderText(/plak hier/i), `${PASTE_HEADER}\nDe Meerwaarde\tHan\tdocent Nederlands`);
    await user.click(screen.getByRole('button', { name: /verwerken/i }));

    expect(screen.getByText(/1 project(s|) found/i)).toBeInTheDocument();
    expect(screen.getByText(/0 new/i)).toBeInTheDocument();
    expect(screen.getByText(/1 already exist/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import 0 projects/i })).toBeDisabled();
  });

  it('re-importing the same duplicate never calls onImport with the duplicate row — an existing project\'s status is never touched', async () => {
    const user = userEvent.setup();
    const existing = new Set([buildProjectFingerprint('owner-1', 'De Meerwaarde', 'Han', null)]);
    const onImport = vi.fn().mockResolvedValue({ ok: true, count: 1 });
    render(<ImportPanel ownerId="owner-1" existingFingerprints={existing} onImport={onImport} />);

    await user.click(screen.getByRole('button', { name: /paste from excel/i }));
    pasteInto(screen.getByPlaceholderText(/plak hier/i), `Project\tKlant\nDe Meerwaarde\tHan\nGreijdanus\tRyan`);
    await user.click(screen.getByRole('button', { name: /verwerken/i }));
    await user.click(screen.getByRole('button', { name: /import 1 projects/i }));

    expect(onImport).toHaveBeenCalledTimes(1);
    const preview = onImport.mock.calls[0][0];
    expect(preview.newRows).toHaveLength(1);
    expect(preview.newRows[0].input.projectName).toBe('Greijdanus');
    expect(preview.existingRows).toHaveLength(1);
    expect(preview.existingRows[0].input.projectName).toBe('De Meerwaarde');
  });
});

describe('ImportPanel — real file upload (the actual downloaded-and-filled-in template)', () => {
  it('uploading a filled-in copy of the real generated template parses and previews correctly', async () => {
    const user = userEvent.setup();
    const workbook = buildTemplateWorkbook();
    XLSX.utils.sheet_add_aoa(
      workbook.Sheets[TEMPLATE_SHEET_NAME],
      [
        ['De Meerwaarde', 'Han', 'docent Nederlands', '2026-09-01', '2027-01-31', 16, 950.5, 'Interessant'],
        ['Greijdanus', 'Ryan', 'Economie', '', '', 20, '', ''],
      ],
      { origin: -1 },
    );
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const file = new File([buffer], 'Mission-Hunt-Projecten.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    render(<ImportPanel ownerId="owner-1" existingFingerprints={new Set()} onImport={vi.fn()} />);

    const fileInput = screen.getByLabelText(/kies projectbestand/i);
    await user.upload(fileInput, file);

    expect(await screen.findByText(/2 projects found/i)).toBeInTheDocument();
    expect(screen.getByText(/2 new/i)).toBeInTheDocument();
  });
});

describe('ImportPanel — header validation', () => {
  it('shows a clear, non-technical error when Klant is missing', async () => {
    const user = userEvent.setup();
    render(<ImportPanel ownerId="owner-1" existingFingerprints={new Set()} onImport={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /paste from excel/i }));
    pasteInto(screen.getByPlaceholderText(/plak hier/i), 'Project\nDe Meerwaarde');
    await user.click(screen.getByRole('button', { name: /verwerken/i }));

    expect(screen.getByText(/ontbrekende kolom/i)).toBeInTheDocument();
    expect(screen.getByText(/klant/i)).toBeInTheDocument();
    expect(screen.queryByText(/stacktrace|undefined|typeerror/i)).not.toBeInTheDocument();
  });
});
