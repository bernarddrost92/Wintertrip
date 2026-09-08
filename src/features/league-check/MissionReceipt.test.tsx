import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { computeResultForForm } from '../calculator/computeResult';
import { calculateFoundPoints } from '../../services/missionReceipt';
import { MissionReceipt } from './MissionReceipt';
import type { CalculatorForm } from '../calculator/useMissionControlCalculator';
import type { AgentIdentity, BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';

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

function renderReceipt(agent: AgentIdentity) {
  const beforeCheck = buildBeforeCheck();
  const afterCheck = buildAfterCheck(beforeCheck, '2027-10-01');
  return render(<MissionReceipt beforeCheck={beforeCheck} afterCheck={afterCheck} agent={agent} checkedCount={6} total={6} />);
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
