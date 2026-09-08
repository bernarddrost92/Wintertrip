import { describe, expect, it } from 'vitest';
import { buildReceiptFilename, buildWhatsAppSummary, type ReceiptSummaryInput } from './receiptImage';
import type { AgentIdentity } from '../missionFlow/missionFlowContext';

describe('buildReceiptFilename', () => {
  it('is date-stamped and carries no client or professional name', () => {
    const name = buildReceiptFilename(new Date(2026, 8, 8)); // month is 0-indexed: September
    expect(name).toBe('operatie-wintertrip-2027-receipt-2026-09-08.png');
  });

  it('zero-pads single-digit months and days', () => {
    const name = buildReceiptFilename(new Date(2027, 0, 5));
    expect(name).toBe('operatie-wintertrip-2027-receipt-2027-01-05.png');
  });
});

describe('buildWhatsAppSummary', () => {
  const agent: AgentIdentity = { agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim Jansen' };

  const base: ReceiptSummaryInput = {
    agent,
    missionType: 'NEW_PLACEMENT',
    term: { start: '2027-01-05', end: '2027-08-01' },
    vcdbPerMonth: 20,
    factor: 2.5,
    before: { baseScore: 40, finalScore: 100 },
    after: { baseScore: 60, finalScore: 150 },
    found: { foundBasePoints: 20, foundLeaguePoints: 50 },
    checkedCount: 6,
    total: 6,
  };

  it('includes the Agent name and role', () => {
    const text = buildWhatsAppSummary(base);
    expect(text).toContain('Bernard — AM');
  });

  it('shows the TM role when the Agent is a Talentmanager', () => {
    const text = buildWhatsAppSummary({ ...base, agent: { ...agent, agentRole: 'TM' } });
    expect(text).toContain('Bernard — TM');
  });

  it('includes the Professional name', () => {
    const text = buildWhatsAppSummary(base);
    expect(text).toContain('Tim Jansen');
  });

  it('includes the mission/league result figures', () => {
    const text = buildWhatsAppSummary(base);
    expect(text).toContain('6/6');
    expect(text).toContain('+50,00');
    expect(text).toContain('2,5x');
  });

  it('omits the qualifying term block when there is no term', () => {
    const text = buildWhatsAppSummary({ ...base, term: null });
    expect(text).not.toContain('QUALIFYING TERM');
  });

  it('falls back to an em dash when the Agent or Professional name is blank', () => {
    const text = buildWhatsAppSummary({ ...base, agent: { agentName: '', agentRole: 'AM', professionalName: '' } });
    expect(text).toContain('— AM');
    expect(text).toContain('—');
  });
});
