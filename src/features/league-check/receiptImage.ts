import { toBlob } from 'html-to-image';
import { formatIsoDateReceipt } from '../../utils/dates';
import { formatFactor, formatFoundPoints, formatVcdbValue } from '../../utils/format';
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

/** "operatie-wintersport-2027-receipt-2026-09-08.png" — no client or
 * professional name, ever, per spec. */
export function buildReceiptFilename(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `operatie-wintersport-2027-receipt-${y}-${m}-${d}.png`;
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
  missionType: MissionType;
  term: { start: IsoDate; end: IsoDate } | null;
  vcdbPerMonth: number;
  factor: number;
  before: { baseScore: number; finalScore: number };
  after: { baseScore: number; finalScore: number };
  found: { foundBasePoints: number; foundLeaguePoints: number };
  checkedCount: number;
  total: number;
}

/** Plain-text WhatsApp summary — the COPY WHATSAPP TEXT fallback when
 * native file sharing isn't available, and matches the on-screen/PNG
 * receipt: who ran the check, for which professional, and the mission
 * result — nothing hidden. */
export function buildWhatsAppSummary(input: ReceiptSummaryInput): string {
  const lines = [
    'OPERATIE WINTERSPORT 2027',
    '',
    `MISSION APPROVED — ${input.checkedCount}/${input.total}`,
    '',
    'AGENT:',
    `${input.agent.agentName || '—'} — ${input.agent.agentRole}`,
    '',
    'PROFESSIONAL:',
    input.agent.professionalName || '—',
    '',
    `MISSION TYPE: ${MISSION_TYPE_LABEL[input.missionType]}`,
  ];
  if (input.term) {
    lines.push(`QUALIFYING TERM: ${formatIsoDateReceipt(input.term.start)} — ${formatIsoDateReceipt(input.term.end)}`);
  }
  lines.push(
    `VCDB/MONTH: ${formatVcdbValue(input.vcdbPerMonth)}`,
    `FACTOR: ${formatFactor(input.factor)}`,
    '',
    'BEFORE LEAGUE CHECK:',
    `${formatVcdbValue(input.before.finalScore)} punten`,
    '',
    'AFTER LEAGUE CHECK:',
    `${formatVcdbValue(input.after.finalScore)} punten`,
    '',
    'PUNTEN GEVONDEN:',
    formatFoundPoints(input.found.foundLeaguePoints),
    '',
    'FINAL MISSION VALUE:',
    `${formatVcdbValue(input.after.finalScore)} punten`,
    '',
    '2 PAAR OGEN = 0 PUNTEN LATEN LIGGEN',
  );
  return lines.join('\n');
}
