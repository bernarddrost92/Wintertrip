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

describe('buildWhatsAppSummary — complete (6/6) with a Calculator session', () => {
  const agent: AgentIdentity = { agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim Jansen' };

  const base: ReceiptSummaryInput = {
    agent,
    checkedCount: 6,
    total: 6,
    openCodes: [],
    missionType: 'NEW_PLACEMENT',
    term: { start: '2027-01-05', end: '2027-08-01' },
    vcdbPerMonth: 20,
    factor: 2.5,
    before: { baseScore: 40, finalScore: 100 },
    after: { baseScore: 60, finalScore: 150 },
    found: { foundBasePoints: 20, foundLeaguePoints: 50 },
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
    expect(text).toContain('2,5x');
  });

  it('leads with FINAL MISSION VALUE, then WINST DOOR DUBBELCHECK, in that order', () => {
    const text = buildWhatsAppSummary(base);
    expect(text).toContain('FINAL MISSION VALUE:\n150,00 punten');
    expect(text).toContain('WINST DOOR DUBBELCHECK:\n+50,00 punten');
    expect(text.indexOf('FINAL MISSION VALUE')).toBeLessThan(text.indexOf('WINST DOOR DUBBELCHECK'));
  });

  it('no longer uses the old "PUNTEN GEVONDEN" terminology', () => {
    const text = buildWhatsAppSummary(base);
    expect(text).not.toContain('PUNTEN GEVONDEN');
  });

  it('reads MISSION APPROVED at 6/6', () => {
    const text = buildWhatsAppSummary(base);
    expect(text).toContain('MISSION APPROVED — 6/6');
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

describe('buildWhatsAppSummary — incomplete (relaxed gating)', () => {
  const agent: AgentIdentity = { agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim' };

  const incomplete: ReceiptSummaryInput = {
    agent,
    checkedCount: 5,
    total: 6,
    openCodes: ['VALUE'],
    missionType: 'NEW_PLACEMENT',
    term: { start: '2027-01-05', end: '2027-08-01' },
    vcdbPerMonth: 20,
    factor: 2.5,
    before: { baseScore: 40, finalScore: 61.33 },
    after: { baseScore: 60, finalScore: 61.33 },
    found: { foundBasePoints: 17.79, foundLeaguePoints: 44.47 },
  };

  it('C. reads MISSION OPEN, not APPROVED, below 6/6', () => {
    const text = buildWhatsAppSummary(incomplete);
    expect(text).toContain('MISSION OPEN — 5/6');
    expect(text).not.toContain('MISSION APPROVED');
  });

  it('D. lists the open check codes', () => {
    const text = buildWhatsAppSummary(incomplete);
    expect(text).toContain('OPEN CHECKS');
    expect(text).toContain('- VALUE');
  });

  it('E. still shows Final Mission Value and Winst door Dubbelcheck when a Calculator session exists', () => {
    const text = buildWhatsAppSummary(incomplete);
    expect(text).toContain('FINAL MISSION VALUE:\n61,33 punten');
    expect(text).toContain('WINST DOOR DUBBELCHECK:\n+44,47 punten');
  });

  it('shows the not-yet-verified disclaimer instead of the approved line', () => {
    const text = buildWhatsAppSummary(incomplete);
    expect(text).toContain('MOGELIJKE WINST NOG NIET VOLLEDIG GECONTROLEERD');
    expect(text).not.toContain('2 PAAR OGEN = 0 PUNTEN LATEN LIGGEN');
  });

  it('G. a zero found-points delta shows "GEEN EXTRA WINST VASTGELEGD", never +0,00', () => {
    const text = buildWhatsAppSummary({ ...incomplete, found: { foundBasePoints: 0, foundLeaguePoints: 0 } });
    expect(text).toContain('WINST DOOR DUBBELCHECK:\nGEEN EXTRA WINST VASTGELEGD');
    expect(text).not.toContain('+0,00');
  });

  it('H. no Calculator session shows FINAL MISSION VALUE: PENDING CALCULATION and WINST DOOR DUBBELCHECK: NIET BEREKEND', () => {
    const text = buildWhatsAppSummary({
      agent,
      checkedCount: 3,
      total: 6,
      openCodes: ['MAX TERM', 'HOURS', 'VALUE'],
      missionType: null,
      term: null,
      vcdbPerMonth: null,
      factor: null,
      before: null,
      after: null,
      found: null,
    });
    expect(text).toContain('FINAL MISSION VALUE:\nPENDING CALCULATION');
    expect(text).toContain('WINST DOOR DUBBELCHECK:\nNIET BEREKEND');
    expect(text).not.toContain('MISSION TYPE');
    expect(text).not.toContain('+0,00');
  });
});
