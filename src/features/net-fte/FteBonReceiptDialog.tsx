import { useEffect, useRef, useState } from 'react';
import { Check, Download, Share2, X } from 'lucide-react';
import { GoldButton } from '../../components/GoldButton';
import { OWN_TEAM, type PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';
import type { FteBon } from '../../services/fteBonnen';
import { projectStandings } from '../../services/netFteProjection';
import { buildFteBonFilename, canShareFiles, downloadBlob, renderNodeToPngBlob } from '../league-check/receiptImage';
import { FteBonReceipt } from './FteBonReceipt';

interface FteBonReceiptDialogProps {
  bon: FteBon;
  standings: PowerBiStandingRow[];
  /** Sum of every open bon — this bon included when it is open. */
  openFte: number;
  officialDate: string;
  onClose: () => void;
}

type Status = 'idle' | 'busy' | 'done' | 'error';

/**
 * Shows one FTE-bonnetje on top of the page with SHARE (native file share,
 * straight into WhatsApp) and DOWNLOAD — the same PNG export as the Mission
 * Receipt (league-check/receiptImage.ts), rendered from the on-screen card.
 */
export function FteBonReceiptDialog({ bon, standings, openFte, officialDate, onClose }: FteBonReceiptDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [hasShare] = useState(canShareFiles);
  const [status, setStatus] = useState<Status>('idle');

  const withBon = projectStandings(standings, OWN_TEAM, bon.fteDelta);
  // "All open bonnen" only adds information when there are others besides this one.
  const othersOpen = bon.status === 'open' ? openFte - bon.fteDelta : openFte;
  const withAllOpen = Math.abs(othersOpen) > 0.001 ? projectStandings(standings, OWN_TEAM, othersOpen + bon.fteDelta) : null;

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function render(): Promise<Blob> {
    if (!cardRef.current) throw new Error('Receipt not mounted');
    return renderNodeToPngBlob(cardRef.current);
  }

  async function handleDownload() {
    if (status === 'busy') return;
    setStatus('busy');
    try {
      downloadBlob(await render(), buildFteBonFilename());
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  async function handleShare() {
    if (status === 'busy') return;
    setStatus('busy');
    try {
      const file = new File([await render()], buildFteBonFilename(), { type: 'image/png' });
      await navigator.share({ files: [file], title: 'FTE Receipt' });
      setStatus('done');
    } catch (err) {
      setStatus(err instanceof DOMException && err.name === 'AbortError' ? 'idle' : 'error');
    }
  }

  const busy = status === 'busy';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`FTE-bonnetje ${bon.label}`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-mission-void/90 px-3 py-6 backdrop-blur-md sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[420px] space-y-3">
        <div className="flex justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 border border-gold/30 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gold transition-colors hover:border-gold hover:bg-gold/10"
          >
            <X size={13} aria-hidden />
            Sluiten
          </button>
        </div>

        <FteBonReceipt ref={cardRef} bon={bon} withBon={withBon} withAllOpen={withAllOpen} officialDate={officialDate} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {hasShare && (
            <GoldButton onClick={handleShare} disabled={busy} icon={<Share2 size={16} />} className="w-full">
              Deel bonnetje
            </GoldButton>
          )}
          <GoldButton
            onClick={handleDownload}
            disabled={busy}
            variant={hasShare ? 'ghost' : 'primary'}
            icon={<Download size={16} />}
            className={`w-full ${hasShare ? '' : 'sm:col-span-2'}`}
          >
            Download bonnetje
          </GoldButton>
        </div>
        <p role="status" aria-live="polite" className={`min-h-[1rem] text-center font-mono text-[11px] uppercase tracking-[0.18em] ${status === 'error' ? 'text-red-300' : 'text-gold'}`}>
          {status === 'busy' && 'Bonnetje maken…'}
          {status === 'done' && (
            <>
              <Check size={12} className="mr-1 inline" aria-hidden />
              Klaar
            </>
          )}
          {status === 'error' && 'Dat lukte niet — probeer opnieuw'}
        </p>
      </div>
    </div>
  );
}
