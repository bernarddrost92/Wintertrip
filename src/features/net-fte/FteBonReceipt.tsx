import { forwardRef } from 'react';
import { fteBonTypeLabel, type FteBon } from '../../services/fteBonnen';
import type { StandingsProjection } from '../../services/netFteProjection';
import { formatSignedFte, formatVcdbValue } from '../../utils/format';

interface FteBonReceiptProps {
  bon: FteBon;
  /** Official stand + this bon only. */
  withBon: StandingsProjection;
  /** Official stand + every open bon (null when there are none besides this one). */
  withAllOpen: StandingsProjection | null;
  /** The Power BI snapshot date the official Net FTE comes from, already formatted. */
  officialDate: string;
}

const BARCODE_PATTERN = [2, 1, 1, 3, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 4, 1, 1, 2, 3, 1, 1, 2, 1, 4, 2, 1, 1, 3, 1, 2, 1, 1, 4, 2, 1, 1, 3, 2, 1, 1];

function Divider() {
  return <div className="border-t border-dashed border-gold/20" aria-hidden />;
}

function Row({ label, value, valueClassName = 'text-ink' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[11px]">
      <span className="uppercase tracking-wider text-ink-muted">{label}</span>
      <span className={`font-semibold tabular-nums ${valueClassName}`}>{value}</span>
    </div>
  );
}

function formatBonDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' }).toUpperCase();
}

/**
 * The FTE-bonnetje — the Net FTE counterpart of the Mission Receipt, in the
 * same card style (and exported to PNG the same way): who it's for, which
 * contract move, the FTE it adds, and Zwolle's total Net FTE stand with it.
 * The card has fixed colours so the PNG looks the same in any theme.
 */
export const FteBonReceipt = forwardRef<HTMLDivElement, FteBonReceiptProps>(function FteBonReceipt({ bon, withBon, withAllOpen, officialDate }, ref) {
  const official = withBon.own.official;
  const realized = bon.status !== 'open';

  return (
    <div
      ref={ref}
      className="relative border border-gold/25"
      style={{
        background: 'linear-gradient(180deg, #0d1013 0%, #060708 100%)',
        boxShadow: '0 24px 60px -24px rgba(0,0,0,0.7), 0 0 44px -14px rgba(255,215,104,0.12)',
      }}
    >
      <div className="space-y-4 px-6 py-7 font-mono">
        <div className="space-y-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted">Team Zwolle</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted">Operatie Wintertrip 2027</p>
          <p className="mt-2 font-display text-xl font-bold uppercase tracking-[0.14em] text-gold drop-shadow-[0_0_18px_rgba(255,215,104,0.4)]">
            FTE Receipt
          </p>
        </div>

        <Divider />

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Professional</p>
            <p className="mt-0.5 break-words text-base font-semibold text-ink">{bon.label}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Contractvorm</p>
            <p className="mt-0.5 text-base font-semibold uppercase text-ink">{fteBonTypeLabel(bon.type)}</p>
          </div>
          {bon.owner && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Talent Manager</p>
              <p className="mt-0.5 break-words text-base font-semibold text-ink">{bon.owner}</p>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold">Status</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold">
              {realized ? 'Gerealiseerd' : 'Open'} <span className="text-ink-muted">· {formatBonDate(bon.createdAt)}</span>
            </span>
          </div>
        </div>

        <Divider />

        <div className="space-y-1.5 py-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">FTE erbij</p>
          <p className="font-display text-5xl font-bold tabular-nums text-gold drop-shadow-[0_0_24px_rgba(255,215,104,0.45)]">{formatSignedFte(bon.fteDelta)}</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">FTE</p>
        </div>

        <Divider />

        <div className="space-y-1.5 py-1 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">Totale FTE-stand Zwolle</p>
          <p className="font-display text-4xl font-bold tabular-nums text-ink">{formatVcdbValue(withBon.own.netFte)}</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">Net FTE · FTE-rank #{withBon.own.netFteRanking}</p>
        </div>

        <Divider />

        <div className="space-y-1.5">
          <Row label={`Officieel (${officialDate})`} value={formatVcdbValue(official.netFte)} />
          <Row label="Deze bon" value={formatSignedFte(bon.fteDelta)} valueClassName="text-gold" />
          <Row label="Nieuwe stand" value={formatVcdbValue(withBon.own.netFte)} />
          <Row label="FTE-rank" value={`#${official.netFteRanking} → #${withBon.own.netFteRanking}`} />
          {withAllOpen && <Row label="Met alle open bonnen" value={formatVcdbValue(withAllOpen.own.netFte)} valueClassName="text-ink-muted" />}
        </div>

        {bon.note && (
          <>
            <Divider />
            <p className="break-words text-[11px] text-ink-muted">{bon.note}</p>
          </>
        )}

        <Divider />

        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="flex h-8 items-stretch gap-[2px]" aria-hidden>
            {BARCODE_PATTERN.map((w, i) => (
              <span key={i} className={`bg-gold/70 ${i % 5 === 0 ? 'opacity-90' : 'opacity-60'}`} style={{ width: `${w * 2}px` }} />
            ))}
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">Elke FTE telt · Wij gaan voor #1</p>
        </div>
      </div>
    </div>
  );
});
