import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { computeResultForForm } from '../calculator/computeResult';
import { LEAGUE_CHECK_ITEMS } from '../../data/leagueCheckItems';
import { MissionReceiptFlow } from './MissionReceiptFlow';
import type { CalculatorForm } from '../calculator/useMissionControlCalculator';
import type { AgentIdentity, BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';

const AGENT: AgentIdentity = { agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim Jansen' };

const FORM: CalculatorForm = {
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
  return { form: FORM, result: computeResultForForm(FORM) };
}

const NONE_CHECKED: Record<string, boolean> = {};
const ALL_CHECKED: Record<string, boolean> = Object.fromEntries(LEAGUE_CHECK_ITEMS.map((item) => [item.id, true]));
const FIVE_OF_SIX: Record<string, boolean> = { ...ALL_CHECKED, value: false };

function clickGenerate() {
  fireEvent.click(screen.getByRole('button', { name: /generate receipt|view receipt/i }));
}

describe('MissionReceiptFlow — receipt is never gated on 6/6', () => {
  it('A. 0/6, no Calculator session: GENERATE RECEIPT is present and produces a receipt', () => {
    render(<MissionReceiptFlow beforeCheck={null} agent={AGENT} checkedItems={NONE_CHECKED} checkedCount={0} total={6} />);
    expect(screen.getByRole('button', { name: /generate receipt/i })).toBeEnabled();
    clickGenerate();
    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
  });

  it('B. 5/6, with a Calculator session: GENERATE RECEIPT is present and produces a receipt', () => {
    render(<MissionReceiptFlow beforeCheck={buildBeforeCheck()} agent={AGENT} checkedItems={FIVE_OF_SIX} checkedCount={5} total={6} />);
    expect(screen.getByRole('button', { name: /generate receipt/i })).toBeEnabled();
    clickGenerate();
    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
  });

  it('F. League Check without a Calculator session at all: the flow renders and the receipt still generates', () => {
    render(<MissionReceiptFlow beforeCheck={null} agent={AGENT} checkedItems={ALL_CHECKED} checkedCount={6} total={6} />);
    clickGenerate();
    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
    expect(screen.getByText('Tim Jansen')).toBeInTheDocument();
  });

  it('G. without a Calculator session, Mission Value reads Pending Calculation, not 0', () => {
    render(<MissionReceiptFlow beforeCheck={null} agent={AGENT} checkedItems={FIVE_OF_SIX} checkedCount={5} total={6} />);
    expect(screen.getAllByText('Pending Calculation').length).toBeGreaterThan(0);
    clickGenerate();
    expect(screen.getAllByText('Pending Calculation').length).toBeGreaterThan(0);
  });

  it('H. with a Calculator session at 5/6, the existing Mission Value panel stays visible', () => {
    render(<MissionReceiptFlow beforeCheck={buildBeforeCheck()} agent={AGENT} checkedItems={FIVE_OF_SIX} checkedCount={5} total={6} />);
    expect(screen.getByText('Base Score')).toBeInTheDocument();
    expect(screen.getByText('Gevonden Winst')).toBeInTheDocument();
    expect(screen.queryByText('Pending Calculation')).not.toBeInTheDocument();
  });

  it('J. download/share/copy actions are present and enabled on an incomplete receipt', () => {
    render(<MissionReceiptFlow beforeCheck={buildBeforeCheck()} agent={AGENT} checkedItems={FIVE_OF_SIX} checkedCount={5} total={6} />);
    clickGenerate();
    expect(screen.getByRole('button', { name: /download receipt/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /copy whatsapp text|share receipt/i })).toBeEnabled();
  });

  it('the button label calls out Mission Approved once 6/6 is reached', () => {
    render(<MissionReceiptFlow beforeCheck={buildBeforeCheck()} agent={AGENT} checkedItems={ALL_CHECKED} checkedCount={6} total={6} />);
    expect(screen.getByRole('button', { name: /mission approved.*view receipt/i })).toBeInTheDocument();
  });

  it('J. the generated receipt (the same node the PNG is rendered from) carries both hero labels', () => {
    render(<MissionReceiptFlow beforeCheck={buildBeforeCheck()} agent={AGENT} checkedItems={ALL_CHECKED} checkedCount={6} total={6} />);
    clickGenerate();
    expect(screen.getByText('Final Mission Value')).toBeInTheDocument();
    expect(screen.getByText('Winst door Dubbelcheck')).toBeInTheDocument();
  });
});
