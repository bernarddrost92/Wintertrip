import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { computeResultForForm } from '../calculator/computeResult';
import { calculateFoundPoints } from '../../services/missionReceipt';
import { LEAGUE_CHECK_ITEMS } from '../../data/leagueCheckItems';
import { MissionReceipt } from './MissionReceipt';
import type { CalculatorForm } from '../calculator/useMissionControlCalculator';
import type { AgentIdentity, BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';

const ALL_CHECKED: Record<string, boolean> = Object.fromEntries(LEAGUE_CHECK_ITEMS.map((item) => [item.id, true]));

/** 4/6 — HOURS and VALUE left open, matching the spec's own worked example. */
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

function buildAfterCheck(beforeCheck: BeforeCheckSnapshot, endDate: string) {
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
  const agent: AgentIdentity = { agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim Jansen' };

  it('E. 6/6 reads Mission Approved', () => {
    const { container } = renderReceipt(agent, ALL_CHECKED);
    expect(container.textContent).toContain('Approved');
    expect(container.textContent).toContain('Mission Approved');
  });

  it('C. 5/6 reads Open, not Approved', () => {
    const { container } = renderReceipt(agent, FIVE_OF_SIX);
    expect(container.textContent).toContain('Open');
    expect(container.textContent).not.toContain('Mission Approved');
  });

  it('D. 5/6 shows the one missing check (VALUE) as an open item', () => {
    const { container } = renderReceipt(agent, FIVE_OF_SIX);
    expect(container.textContent).toContain('Open Checks');
    expect(container.textContent).toContain('VALUE');
  });

  it('4/6 shows both missing checks (HOURS, VALUE) as open items', () => {
    const { container } = renderReceipt(agent, FOUR_OF_SIX);
    expect(container.textContent).toContain('HOURS');
    expect(container.textContent).toContain('VALUE');
  });

  it('never fabricates a "potential points" figure for an open check', () => {
    const { container } = renderReceipt(agent, FIVE_OF_SIX);
    expect(container.textContent).not.toMatch(/potential/i);
    expect(container.textContent).not.toMatch(/verzonnen/i);
  });

  it('I. an unchecked item does not change Punten Gevonden — it stays the real Base Score delta × Factor', () => {
    const beforeCheck = buildBeforeCheck();
    const afterCheck = buildAfterCheck(beforeCheck, '2027-10-01');
    const expected = calculateFoundPoints(beforeCheck.result.baseScore, afterCheck.result.baseScore, afterCheck.form.factor);

    const complete = render(
      <MissionReceipt beforeCheck={beforeCheck} afterCheck={afterCheck} agent={agent} checkedItems={ALL_CHECKED} checkedCount={6} total={6} />,
    );
    const incomplete = render(
      <MissionReceipt beforeCheck={beforeCheck} afterCheck={afterCheck} agent={agent} checkedItems={FIVE_OF_SIX} checkedCount={5} total={6} />,
    );

    const sign = expected.foundLeaguePoints < 0 ? '−' : '+';
    const foundText = `${sign}${Math.abs(expected.foundLeaguePoints).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    expect(complete.container.textContent).toContain(foundText);
    expect(incomplete.container.textContent).toContain(foundText);
  });

  it('shows the disclaimer line instead of "2 Paar Ogen" when incomplete', () => {
    const { container } = renderReceipt(agent, FIVE_OF_SIX);
    expect(container.textContent).toContain('nog niet volledig gecontroleerd');
    expect(container.textContent).not.toContain('0 Punten Laten Liggen');
  });
});

describe('MissionReceipt — without a Calculator session', () => {
  const agent: AgentIdentity = { agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim Jansen' };

  it('G. shows Mission Value as Pending Calculation, never 0', () => {
    const { container } = render(
      <MissionReceipt beforeCheck={null} afterCheck={null} agent={agent} checkedItems={FIVE_OF_SIX} checkedCount={5} total={6} />,
    );
    expect(container.textContent).toContain('Pending Calculation');
    expect(container.textContent).not.toMatch(/Mission Value[\s\S]{0,20}0,00/);
  });

  it('still shows Agent/Professional and the open checklist even without a score', () => {
    const { container } = render(
      <MissionReceipt beforeCheck={null} afterCheck={null} agent={agent} checkedItems={FOUR_OF_SIX} checkedCount={4} total={6} />,
    );
    expect(container.textContent).toContain('Bernard');
    expect(container.textContent).toContain('Tim Jansen');
    expect(container.textContent).toContain('HOURS');
    expect(container.textContent).toContain('VALUE');
  });
});
