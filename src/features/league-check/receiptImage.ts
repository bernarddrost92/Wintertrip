import { toBlob } from 'html-to-image';
import { formatIsoDateReceipt } from '../../utils/dates';
import { formatFactor, formatFoundPoints, formatVcdbValue } from '../../utils/format';
import { getDubbelcheckState } from './dubbelcheckStatus';
import type { IsoDate, MissionType } from '../../types/league';
import type { AgentIdentity } from '../missionFlow/missionFlowContext';

/** Target output width for the exported PNG — high enough to stay crisp on
 * a phone screen after a WhatsApp re-compress, without ballooning file size. */
const EXPORT_TARGET_WIDTH = 1080;

/** Font embedding fetches the Google Fonts CSS cross-origin; on a
 * restrictive network (a corporate proxy blocking the font CDN) that can
 * stall well past what feels responsive. Bounding it means DOWNLOAD/SHARE
 * always resolve one way or another instead of hanging on "Generating…". */
const RENDER_TIMEOUT_MS = 15_000;

const MISSION_TYPE_LABEL: Record<MissionType, string> = {
  NEW_PLACEMENT: 'NIEUWE PLAATSING',
  EXTENSION: 'VERLENGING',
  HOURS_INCREASE: 'URENUITBREIDING',
};

/** Renders a DOM node to a PNG Blob at a fixed high output width, scaling
 * pixelRatio from the node's own rendered width so text stays sharp
 * regardless of the viewport it was captured from. */
export async function renderNodeToPngBlob(node: HTMLElement, targetWidth = EXPORT_TARGET_WIDTH): Promise<Blob> {
  const width = node.offsetWidth || targetWidth;
  const pixelRatio = Math.max(2, targetWidth / width);
  const blob = await Promise.race([
    toBlob(node, { pixelRatio, backgroundColor: '#030405', cacheBust: true }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Receipt image generation timed out')), RENDER_TIMEOUT_MS),
    ),
  ]);
  if (!blob) throw new Error('Receipt image generation failed');
  return blob;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** "operatie-wintertrip-2027-receipt-2026-09-08.png" — date-stamped, no
 * client name in the filename itself. */
export function buildReceiptFilename(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `operatie-wintertrip-2027-receipt-${y}-${m}-${d}.png`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Feature-detects the Web Share API's file-sharing support (Level 2) with
 * a throwaway File — the standard way to check before generating the real
 * PNG, since canShare requires an actual File/Blob to evaluate against. */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false;
  }
  try {
    const probe = new File([''], 'probe.png', { type: 'image/png' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export interface ReceiptSummaryInput {
  agent: AgentIdentity;
  checkedCount: number;
  total: number;
  /** Bare check codes ("HOURS", "VALUE") that are not yet ticked — printed
   * plainly, never turned into a guessed points figure. */
  openCodes: string[];
  /** Null when the League Check was run standalone, without a Calculator
   * session behind it — the summary then reads "Mission Value: Pending
   * Calculation" instead of fabricating a score. */
  missionType: MissionType | null;
  term: { start: IsoDate; end: IsoDate } | null;
  vcdbPerMonth: number | null;
  factor: number | null;
  before: { baseScore: number; finalScore: number } | null;
  after: { baseScore: number; finalScore: number } | null;
  found: { foundBasePoints: number; foundLeaguePoints: number } | null;
}

/** Plain-text WhatsApp summary — the COPY WHATSAPP TEXT fallback when
 * native file sharing isn't available, and matches the on-screen/PNG
 * receipt: who ran the check, for which professional, and the mission
 * result — nothing hidden, and available at any checked count. */
export function buildWhatsAppSummary(input: ReceiptSummaryInput): string {
  const missionApproved = input.checkedCount === input.total;

  const lines = [
    'OPERATIE WINTERTRIP 2027',
    '',
    `MISSION ${missionApproved ? 'APPROVED' : 'OPEN'} — ${input.checkedCount}/${input.total}`,
    '',
    'AGENT:',
    `${input.agent.agentName || '—'} — ${input.agent.agentRole}`,
    '',
    'PROFESSIONAL:',
    input.agent.professionalName || '—',
  ];

  if (!missionApproved && input.openCodes.length > 0) {
    lines.push('', 'OPEN CHECKS:', ...input.openCodes.map((code) => `- ${code}`));
  }

  // Hero #1 — Final Mission Value — comes first, before any deal detail,
  // so it's the first thing read here too, matching the on-screen/PNG
  // receipt's hierarchy.
  if (input.after) {
    lines.push('', 'FINAL MISSION VALUE:', `${formatVcdbValue(input.after.finalScore)} punten`);
  } else {
    lines.push('', 'FINAL MISSION VALUE:', 'PENDING CALCULATION');
  }

  // Hero #2 — Winst door Dubbelcheck — never a fabricated "+0,00".
  const dubbelcheck = getDubbelcheckState(input.found ? input.found.foundLeaguePoints : null);
  lines.push('', 'WINST DOOR DUBBELCHECK:');
  if (dubbelcheck.kind === 'found') {
    lines.push(`${formatFoundPoints(dubbelcheck.points)} punten`);
  } else if (dubbelcheck.kind === 'none-recorded') {
    lines.push('GEEN EXTRA WINST VASTGELEGD');
  } else {
    lines.push('NIET BEREKEND');
  }

  if (input.missionType) {
    lines.push('', `MISSION TYPE: ${MISSION_TYPE_LABEL[input.missionType]}`);
    if (input.term) {
      lines.push(`QUALIFYING TERM: ${formatIsoDateReceipt(input.term.start)} — ${formatIsoDateReceipt(input.term.end)}`);
    }
    lines.push(`VCDB/MONTH: ${formatVcdbValue(input.vcdbPerMonth ?? 0)}`, `FACTOR: ${formatFactor(input.factor ?? 0)}`);
  }

  if (input.before && input.after) {
    lines.push(
      '',
      'BEFORE LEAGUE CHECK:',
      `${formatVcdbValue(input.before.finalScore)} punten`,
      '',
      'AFTER LEAGUE CHECK:',
      `${formatVcdbValue(input.after.finalScore)} punten`,
    );
  }

  lines.push('', missionApproved ? '2 PAAR OGEN = 0 PUNTEN LATEN LIGGEN' : 'MOGELIJKE WINST NOG NIET VOLLEDIG GECONTROLEERD');

  return lines.join('\n');
}
