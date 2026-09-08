import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { computeResultForForm } from '../calculator/computeResult';
import { calculateFoundPoints } from '../../services/missionReceipt';
import { LEAGUE_CHECK_ITEMS } from '../../data/leagueCheckItems';
import { MissionReceipt } from './MissionReceipt';
import type { CalculatorForm } from '../calculator/useMissionControlCalculator';
import type { AgentIdentity, BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';

const ALL_CHECKED: Record<string, boolean> = Object.fromEntries(LEAGUE_CHECK_ITEMS.map((item) => [item.id, true]));

/** 5/6 — VALUE left open, matching the spec's own worked example. */
const FIVE_OF_SIX: Record<string, boolean> = { ...ALL_CHECKED, value: false };
const FOUR_OF_SIX: Record<string, boolean> = { ...ALL_CHECKED, hours: false, value: false };

const BEFORE_FORM: CalculatorForm = {
  missionType: 'NEW_PLACEMENT',
  dealCategory: 'DETACHERING',
  factor: 2.5,
  startDate: '2027-01-05',
  endDate: '2027-08-01',
  vcdbPerMonth: '20',
  oldEndDate: '',
  newEndDate: '',
  extensionVcdbPerMonth: '',
  increaseStartDate: '',
  increaseEndDate: '',
  oldHours: '',
  newHours: '',
  extraVcdbPerMonth: '',
};

function buildBeforeCheck(): BeforeCheckSnapshot {
  return { form: BEFORE_FORM, result: computeResultForForm(BEFORE_FORM) };
}

/** endDate unchanged from BEFORE_FORM by default — a genuine "no edit"
 * After Check, used by the zero-found-points tests below. */
function buildAfterCheck(beforeCheck: BeforeCheckSnapshot, endDate: string = beforeCheck.form.endDate) {
  const form: CalculatorForm = { ...beforeCheck.form, endDate };
  const result = computeResultForForm(form);
  const found = calculateFoundPoints(beforeCheck.result.baseScore, result.baseScore, form.factor);
  return { form, result, found, update: () => {} };
}

function renderReceipt(agent: AgentIdentity, checkedItems: Record<string, boolean> = ALL_CHECKED) {
  const beforeCheck = buildBeforeCheck();
  const afterCheck = buildAfterCheck(beforeCheck, '2027-10-01');
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  return render(
    <MissionReceipt beforeCheck={beforeCheck} afterCheck={afterCheck} agent={agent} checkedItems={checkedItems} checkedCount={checkedCount} total={6} />,
  );
}

const AGENT: AgentIdentity = { agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim Jansen' };

describe('MissionReceipt — Agent, Role and Professional are always visible on the kassabon', () => {
  it('shows the Agent name and AM role', () => {
    const { container } = renderReceipt({ agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim Jansen' });
    expect(container.textContent).toContain('Bernard');
    expect(container.textContent).toContain('· AM');
  });

  it('shows the TM role when the Agent is a Talentmanager', () => {
    const { container } = renderReceipt({ agentName: 'Jordan', agentRole: 'TM', professionalName: 'Anne de Vries' });
    expect(container.textContent).toContain('Jordan');
    expect(container.textContent).toContain('· TM');
  });

  it('shows the Professional name', () => {
    const { container } = renderReceipt({ agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim Jansen' });
    expect(container.textContent).toContain('Tim Jansen');
  });

  it('never renders the old perforated-edge kartelrand', () => {
    const { container } = renderReceipt({ agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim Jansen' });
    expect(container.querySelectorAll('span.rounded-full').length).toBe(0);
  });
});

describe('MissionReceipt — status and open checks (relaxed gating)', () => {
  it('E. 6/6 reads Mission Approved', () => {
    const { container } = renderReceipt(AGENT, ALL_CHECKED);
    expect(container.textContent).toContain('Approved');
    expect(container.textContent).toContain('Mission Approved');
  });

  it('C. 5/6 reads Open, not Approved', () => {
    const { container } = renderReceipt(AGENT, FIVE_OF_SIX);
    expect(container.textContent).toContain('Open');
    expect(container.textContent).not.toContain('Mission Approved');
  });

  it('D. 5/6 shows the one missing check (VALUE) as an open item', () => {
    const { container } = renderReceipt(AGENT, FIVE_OF_SIX);
    expect(container.textContent).toContain('Open Checks');
    expect(container.textContent).toContain('VALUE');
  });

  it('4/6 shows both missing checks (HOURS, VALUE) as open items', () => {
    const { container } = renderReceipt(AGENT, FOUR_OF_SIX);
    expect(container.textContent).toContain('HOURS');
    expect(container.textContent).toContain('VALUE');
  });

  it('I. never fabricates a "potential points" figure for an open check', () => {
    const { container } = renderReceipt(AGENT, FIVE_OF_SIX);
    expect(container.textContent).not.toMatch(/potential/i);
    expect(container.textContent).not.toMatch(/verzonnen/i);
  });
});

describe('MissionReceipt — Final Mission Value (Hero #1)', () => {
  it('A. is the biggest score on the receipt and shows the exact same figure the calculator produced', () => {
    const beforeCheck = buildBeforeCheck();
    const afterCheck = buildAfterCheck(beforeCheck, '2027-10-01');
    const { container } = render(
      <MissionReceipt beforeCheck={beforeCheck} afterCheck={afterCheck} agent={AGENT} checkedItems={ALL_CHECKED} checkedCount={6} total={6} />,
    );
    expect(container.textContent).toContain('Final Mission Value');
    const expected = afterCheck.result.finalScore.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    expect(container.textContent).toContain(expected);
    const hero = Array.from(container.querySelectorAll('p')).find((p) => p.textContent === expected);
    expect(hero?.className).toContain('text-5xl');
  });

  it('C. renders with a score visible even when the check is only 5/6', () => {
    const { container } = renderReceipt(AGENT, FIVE_OF_SIX);
    expect(container.textContent).toContain('Final Mission Value');
    expect(container.textContent).not.toContain('Pending Calculation');
  });

  it('D/16. without a Calculator session, reads Pending Calculation, never a fake 0', () => {
    const { container } = render(
      <MissionReceipt beforeCheck={null} afterCheck={null} agent={AGENT} checkedItems={FIVE_OF_SIX} checkedCount={5} total={6} />,
    );
    expect(container.textContent).toContain('Final Mission Value');
    expect(container.textContent).toContain('Pending Calculation');
    expect(container.textContent).not.toMatch(/Final Mission Value[\s\S]{0,30}0,00/);
  });
});

describe('MissionReceipt — Winst door Dubbelcheck (Hero #2, ~75% of Hero #1, never a fabricated +0,00)', () => {
  it('is sized smaller than Final Mission Value (text-4xl vs text-5xl)', () => {
    const beforeCheck = buildBeforeCheck();
    const afterCheck = buildAfterCheck(beforeCheck, '2027-10-01');
    const { container } = render(
      <MissionReceipt beforeCheck={beforeCheck} afterCheck={afterCheck} agent={AGENT} checkedItems={ALL_CHECKED} checkedCount={6} total={6} />,
    );
    const foundText = `+${afterCheck.found.foundLeaguePoints.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const hero = Array.from(container.querySelectorAll('p')).find((p) => p.textContent === foundText);
    expect(hero?.className).toContain('text-4xl');
    expect(hero?.className).not.toContain('text-5xl');
  });

  it('F. a genuine non-zero delta shows the real +XX,XX figure', () => {
    const beforeCheck = buildBeforeCheck();
    const afterCheck = buildAfterCheck(beforeCheck, '2027-10-01');
    const { container } = render(
      <MissionReceipt beforeCheck={beforeCheck} afterCheck={afterCheck} agent={AGENT} checkedItems={ALL_CHECKED} checkedCount={6} total={6} />,
    );
    const expected = afterCheck.found.foundLeaguePoints;
    const sign = expected < 0 ? '−' : '+';
    const foundText = `${sign}${Math.abs(expected).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    expect(container.textContent).toContain('Winst door Dubbelcheck');
    expect(container.textContent).toContain(foundText);
  });

  it('B. found points is unaffected by which checks are ticked — same delta at 6/6 and 5/6', () => {
    const beforeCheck = buildBeforeCheck();
    const afterCheck = buildAfterCheck(beforeCheck, '2027-10-01');
    const expected = calculateFoundPoints(beforeCheck.result.baseScore, afterCheck.result.baseScore, afterCheck.form.factor);
    const sign = expected.foundLeaguePoints < 0 ? '−' : '+';
    const foundText = `${sign}${Math.abs(expected.foundLeaguePoints).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const complete = render(
      <MissionReceipt beforeCheck={beforeCheck} afterCheck={afterCheck} agent={AGENT} checkedItems={ALL_CHECKED} checkedCount={6} total={6} />,
    );
    const incomplete = render(
      <MissionReceipt beforeCheck={beforeCheck} afterCheck={afterCheck} agent={AGENT} checkedItems={FIVE_OF_SIX} checkedCount={5} total={6} />,
    );
    expect(complete.container.textContent).toContain(foundText);
    expect(incomplete.container.textContent).toContain(foundText);
  });

  it('G. an exact zero delta (no edit made) shows "Geen Extra Winst Vastgelegd", never +0,00', () => {
    const beforeCheck = buildBeforeCheck();
    const afterCheck = buildAfterCheck(beforeCheck); // no endDate change — genuinely nothing edited
    expect(afterCheck.found.foundLeaguePoints).toBe(0);

    const { container } = render(
      <MissionReceipt beforeCheck={beforeCheck} afterCheck={afterCheck} agent={AGENT} checkedItems={ALL_CHECKED} checkedCount={6} total={6} />,
    );
    expect(container.textContent).toContain('Geen Extra Winst Vastgelegd');
    // The hero itself never prints a number for this state — no "Extra
    // League Points" caption, which only renders alongside a real figure.
    // (A secondary "Base Points Found" row can legitimately still read
    // "+0,00" — that's a different, factual figure, not the hero.)
    expect(container.textContent).not.toContain('Extra League Points');
  });

  it('H. no Calculator session at all shows "Niet Berekend", never +0,00', () => {
    const { container } = render(
      <MissionReceipt beforeCheck={null} afterCheck={null} agent={AGENT} checkedItems={FIVE_OF_SIX} checkedCount={5} total={6} />,
    );
    expect(container.textContent).toContain('Winst door Dubbelcheck');
    expect(container.textContent).toContain('Niet Berekend');
    expect(container.textContent).not.toContain('+0,00');
  });

  it('shows the disclaimer line instead of "2 Paar Ogen" when incomplete', () => {
    const { container } = renderReceipt(AGENT, FIVE_OF_SIX);
    expect(container.textContent).toContain('nog niet volledig gecontroleerd');
    expect(container.textContent).not.toContain('0 Punten Laten Liggen');
  });
});

describe('MissionReceipt — without a Calculator session', () => {
  it('still shows Agent/Professional and the open checklist even without a score', () => {
    const { container } = render(
      <MissionReceipt beforeCheck={null} afterCheck={null} agent={AGENT} checkedItems={FOUR_OF_SIX} checkedCount={4} total={6} />,
    );
    expect(container.textContent).toContain('Bernard');
    expect(container.textContent).toContain('Tim Jansen');
    expect(container.textContent).toContain('HOURS');
    expect(container.textContent).toContain('VALUE');
  });
});
