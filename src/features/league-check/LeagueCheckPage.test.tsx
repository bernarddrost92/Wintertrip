import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LeagueCheckPage } from './LeagueCheckPage';
import { MissionFlowProvider } from '../missionFlow/MissionFlowProvider';

/**
 * Explicit end-to-end coverage for the "receipt button must never be
 * disabled by check count" report: renders the real page (not just the
 * receipt component in isolation), drives it with actual checkbox clicks
 * the way a person would, and asserts the GENERATE RECEIPT button's real
 * DOM enabled/disabled state plus that clicking it genuinely opens the
 * receipt with the right status — never just that the underlying
 * component *can* render if force-mounted.
 */
function renderPage() {
  return render(
    <MissionFlowProvider>
      <LeagueCheckPage />
    </MissionFlowProvider>,
  );
}

async function fillIdentity(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Agent'), 'Bernard');
  await user.type(screen.getByLabelText('Professional'), 'Tim Jansen');
}

const CHECK_IDS = ['timing', 'end-date', 'max-term', 'hours', 'value', 'second-review'] as const;

async function check(user: ReturnType<typeof userEvent.setup>, ids: readonly string[]) {
  for (const id of ids) {
    // Checkbox inputs are visually sr-only (still fully interactive) — id
    // lookup is the simplest, most direct way to drive the real ones.
    const input = document.getElementById(id) as HTMLInputElement;
    await user.click(input);
  }
}

function receiptButton() {
  return screen.getByRole('button', { name: /generate receipt|mission approved.*view receipt/i });
}

describe('LeagueCheckPage — the receipt button is never gated on checked count', () => {
  it('0/6: GENERATE RECEIPT is enabled and clickable', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillIdentity(user);

    const btn = receiptButton();
    expect(btn).toBeEnabled();
    expect(btn).not.toHaveAttribute('disabled');

    await user.click(btn);
    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
  });

  it('3/6: GENERATE RECEIPT is enabled and clickable, receipt shows MISSION OPEN 3/6 with 3 open checks', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillIdentity(user);
    await check(user, ['timing', 'end-date', 'max-term']);

    const btn = receiptButton();
    expect(btn).toBeEnabled();

    await user.click(btn);
    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
    expect(screen.getAllByText(/3\/6/).length).toBeGreaterThan(0);
    expect(screen.getByText('Open Checks')).toBeInTheDocument();
    expect(screen.getAllByText('HOURS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('VALUE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2ND REVIEW').length).toBeGreaterThan(0);
  });

  it('5/6: GENERATE RECEIPT is enabled and clickable, receipt shows MISSION OPEN 5/6 with 1 open check (VALUE)', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillIdentity(user);
    await check(user, ['timing', 'end-date', 'max-term', 'hours', 'second-review']);

    const btn = receiptButton();
    expect(btn).toBeEnabled();

    await user.click(btn);
    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
    expect(screen.getAllByText(/5\/6/).length).toBeGreaterThan(0);
    expect(screen.getByText('Open Checks')).toBeInTheDocument();
    expect(screen.getAllByText('VALUE').length).toBeGreaterThan(0);
  });

  it('6/6: the button reads Mission Approved — View Receipt, is enabled, and opens an Approved receipt', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillIdentity(user);
    await check(user, CHECK_IDS);

    const btn = screen.getByRole('button', { name: /mission approved.*view receipt/i });
    expect(btn).toBeEnabled();

    await user.click(btn);
    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
    expect(screen.queryByText('Open Checks')).not.toBeInTheDocument();
  });

  it('DOWNLOAD RECEIPT and the Copy/Share action are enabled immediately after generating an incomplete (5/6) receipt', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillIdentity(user);
    await check(user, ['timing', 'end-date', 'max-term', 'hours', 'second-review']);
    await user.click(receiptButton());

    expect(screen.getByRole('button', { name: /download receipt/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /copy whatsapp text|share receipt/i })).toBeEnabled();
  });
});
