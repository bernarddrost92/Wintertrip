import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Share2 } from 'lucide-react';
import { GoldButton } from '../../components/GoldButton';
import { getQualifyingTermRange } from '../calculator/computeResult';
import { ReceiptCard } from './MissionReceipt';
import {
  buildReceiptFilename,
  buildWhatsAppSummary,
  canShareFiles,
  downloadBlob,
  renderNodeToPngBlob,
} from './receiptImage';
import type { AfterCheckOutput } from './useAfterCheck';
import type { BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';

interface ReceiptActionsProps {
  beforeCheck: BeforeCheckSnapshot;
  afterCheck: AfterCheckOutput;
  checkedCount: number;
  total: number;
}

type Status = 'idle' | 'busy' | 'done' | 'error';

const STATUS_RESET_MS = 2800;

function vcdbFieldFor(form: AfterCheckOutput['form']): string {
  if (form.missionType === 'NEW_PLACEMENT') return form.vcdbPerMonth;
  if (form.missionType === 'EXTENSION') return form.extensionVcdbPerMonth;
  return form.extraVcdbPerMonth;
}

/**
 * The two ways to get the Mission Receipt off the screen: SHARE (native
 * file share, so it lands straight in WhatsApp's share sheet) and DOWNLOAD
 * (always available — a plain PNG saved to the device, for when share isn't
 * supported or the person just wants the file). Both render from the exact
 * same hidden, redacted ReceiptCard, so the shared and downloaded image are
 * always identical, and both are debounced against double-clicks while a
 * render is in flight.
 */
export function ReceiptActions({ beforeCheck, afterCheck, checkedCount, total }: ReceiptActionsProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [hasShare] = useState(canShareFiles);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function settle(nextStatus: Status, nextMessage: string) {
    setStatus(nextStatus);
    setMessage(nextMessage);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (nextStatus !== 'busy') {
      resetTimer.current = setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, STATUS_RESET_MS);
    }
  }

  async function generatePng(): Promise<Blob> {
    const node = exportRef.current;
    if (!node) throw new Error('Receipt export node not mounted');
    return renderNodeToPngBlob(node);
  }

  async function handleDownload() {
    if (status === 'busy') return;
    settle('busy', 'Generating receipt…');
    try {
      const blob = await generatePng();
      downloadBlob(blob, buildReceiptFilename());
      settle('done', 'Receipt downloaded');
    } catch {
      settle('error', 'Download failed — try again');
    }
  }

  async function handleShare() {
    if (status === 'busy') return;
    settle('busy', 'Generating receipt…');
    try {
      const blob = await generatePng();
      const file = new File([blob], buildReceiptFilename(), { type: 'image/png' });
      await navigator.share({ files: [file], title: 'Mission Receipt' });
      settle('done', 'Receipt shared');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        settle('idle', '');
        return;
      }
      settle('error', 'Share failed — try again');
    }
  }

  async function handleCopyText() {
    if (status === 'busy') return;
    settle('busy', 'Copying…');
    try {
      const term = getQualifyingTermRange(afterCheck.form);
      const text = buildWhatsAppSummary({
        missionType: afterCheck.form.missionType,
        term,
        vcdbPerMonth: Number(vcdbFieldFor(afterCheck.form).replace(',', '.')) || 0,
        factor: afterCheck.form.factor,
        before: { baseScore: beforeCheck.result.baseScore, finalScore: beforeCheck.result.finalScore },
        after: { baseScore: afterCheck.result.baseScore, finalScore: afterCheck.result.finalScore },
        found: afterCheck.found,
        checkedCount,
        total,
      });
      await navigator.clipboard.writeText(text);
      settle('done', 'Copied for WhatsApp');
    } catch {
      settle('error', 'Copy failed — try again');
    }
  }

  const busy = status === 'busy';

  return (
    <div className="mt-4 space-y-3">
      {/* Hidden export card — a redacted (no professional name), opaque-background
          copy of the receipt, rendered off-screen purely as the PNG source. */}
      <div className="pointer-events-none fixed left-0 top-0 h-0 w-0 overflow-hidden" aria-hidden>
        <div ref={exportRef} style={{ width: 420, padding: 32, background: '#030405' }}>
          <ReceiptCard beforeCheck={beforeCheck} afterCheck={afterCheck} professional="" checkedCount={checkedCount} total={total} redactPersonal />
        </div>
      </div>

      <div className="mx-auto grid max-w-[420px] grid-cols-1 gap-3 sm:grid-cols-2">
        {hasShare ? (
          <GoldButton onClick={handleShare} disabled={busy} icon={<Share2 size={16} />} className="w-full py-4 sm:py-3">
            Share Receipt
          </GoldButton>
        ) : (
          <GoldButton onClick={handleCopyText} disabled={busy} variant="ghost" icon={<Copy size={16} />} className="w-full py-4 sm:py-3">
            Copy WhatsApp Text
          </GoldButton>
        )}
        <GoldButton onClick={handleDownload} disabled={busy} variant={hasShare ? 'ghost' : 'primary'} icon={<Download size={16} />} className="w-full py-4 sm:py-3">
          Download Receipt
        </GoldButton>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`text-center font-mono text-[11px] uppercase tracking-[0.18em] transition-opacity duration-200 ${
          message ? 'opacity-100' : 'opacity-0'
        } ${status === 'error' ? 'text-red-400' : status === 'done' ? 'text-gold' : 'text-ink-muted'}`}
      >
        {status === 'done' && <Check size={12} className="mr-1 inline" aria-hidden />}
        {message || ' '}
      </p>
    </div>
  );
}
