import { useState } from 'react';
import { Check, ListChecks, Receipt, RotateCcw, Trash2 } from 'lucide-react';
import { StandBadge } from '../../components/StandBadge';
import { StatTile } from '../../components/StatTile';
import { fteBonTypeLabel, type FteBon } from '../../services/fteBonnen';
import { nextNetFteTarget, type StandingsProjection } from '../../services/netFteProjection';
import { formatSignedFte, formatVcdbValue } from '../../utils/format';
import type { FteBonnenStatus } from '../../hooks/useFteBonnen';

interface OpenBonnenPanelProps {
  status: FteBonnenStatus;
  bonnen: FteBon[];
  openFte: number;
  /** Official stand + every open bon. */
  projection: StandingsProjection;
  onRealize: (id: string) => void;
  onReopen: (id: string) => void;
  onRemove: (id: string) => void;
  onReceipt: (bon: FteBon) => void;
}

function BonRow({ bon, onRealize, onReopen, onRemove, onReceipt }: { bon: FteBon } & Pick<OpenBonnenPanelProps, 'onRealize' | 'onReopen' | 'onRemove' | 'onReceipt'>) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const open = bon.status === 'open';
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${open ? 'text-ink' : 'text-ink-muted line-through'}`}>{bon.label}</p>
        <p className="truncate text-xs text-ink-muted">
          {fteBonTypeLabel(bon.type)}
          {bon.owner && ` · ${bon.owner}`}
          {bon.note && ` · ${bon.note}`}
        </p>
      </div>
      <span className={`font-display text-lg font-bold tabular-nums ${bon.fteDelta < 0 ? 'text-red-300' : open ? 'text-gold' : 'text-ink-muted'}`}>
        {formatSignedFte(bon.fteDelta)}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onReceipt(bon)}
          className="inline-flex items-center gap-1 border border-white/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
          title="FTE-bonnetje uitdraaien"
        >
          <Receipt size={12} aria-hidden />
          Bonnetje
        </button>
        {open ? (
          <button
            type="button"
            onClick={() => onRealize(bon.id)}
            className="inline-flex items-center gap-1 border border-white/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted transition-colors hover:border-status-go hover:text-status-go"
            title="Gerealiseerd — telt vanaf nu in de officiële Net FTE"
          >
            <Check size={12} aria-hidden />
            Gerealiseerd
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onReopen(bon.id)}
            className="inline-flex items-center gap-1 border border-white/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
          >
            <RotateCcw size={12} aria-hidden />
            Heropen
          </button>
        )}
        {confirmDelete ? (
          <button
            type="button"
            onClick={() => onRemove(bon.id)}
            onBlur={() => setConfirmDelete(false)}
            className="border border-red-400/60 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-300"
          >
            Zeker?
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label={`Verwijder ${bon.label}`}
            className="border border-white/15 p-1.5 text-ink-muted transition-colors hover:border-red-400/60 hover:text-red-300"
          >
            <Trash2 size={12} aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * The shared list of FTE-bonnen and what they add up to: official Net FTE +
 * every open bon = the projection. Gerealiseerd bonnen leave the projection
 * (they're in the official Net FTE by then) but stay visible below.
 */
export function OpenBonnenPanel({ status, bonnen, openFte, projection, onRealize, onReopen, onRemove, onReceipt }: OpenBonnenPanelProps) {
  const open = bonnen.filter((bon) => bon.status === 'open');
  const realized = bonnen.filter((bon) => bon.status !== 'open');
  const next = nextNetFteTarget(projection);
  const official = projection.own.official;

  return (
    <section className="panel p-4 sm:p-6" aria-labelledby="open-fte-bonnen">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListChecks size={18} className="text-gold" aria-hidden />
          <h2 id="open-fte-bonnen" className="font-display text-2xl font-black uppercase tracking-tight text-ink">
            Open FTE-bonnen
          </h2>
        </div>
        <StandBadge kind="projection" detail="officieel + alle open bonnen" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-px border border-white/10 bg-white/5 sm:grid-cols-5">
        <StatTile label="Huidige Net FTE" value={formatVcdbValue(official.netFte)} sub={<StandBadge kind="official" />} />
        <StatTile label="Open FTE-bonnen" value={formatSignedFte(openFte)} tone="gold" sub={`${open.length} open`} />
        <StatTile label="Projectie" value={formatVcdbValue(projection.own.netFte)} tone="intel" />
        <StatTile label="Verwachte rank" value={`#${projection.own.netFteRanking}`} tone="intel" sub={`nu #${official.netFteRanking}`} />
        <StatTile
          label="Nog nodig volgende plek"
          value={next ? formatSignedFte(next.fteNeeded) : '—'}
          tone="gold"
          sub={next ? `${next.team} (#${next.rank})` : '#1 in Net FTE'}
        />
      </div>

      {status === 'loading' && <p className="mt-4 text-sm text-ink-muted">Bonnen laden…</p>}
      {status === 'unavailable' && <p className="mt-4 text-sm text-ink-muted">De bonnenlijst is nu niet bereikbaar. De officiële stand hierboven klopt wel.</p>}
      {status === 'ready' && open.length === 0 && (
        <p className="mt-4 border border-dashed border-white/15 px-4 py-6 text-center text-sm text-ink-muted">
          Nog geen open bonnen. Voer hierboven je eerste FTE-bon in.
        </p>
      )}

      {open.length > 0 && (
        <ul className="mt-4 divide-y divide-white/10 border border-white/10 bg-mission-panel">
          {open.map((bon) => (
            <BonRow key={bon.id} bon={bon} onRealize={onRealize} onReopen={onReopen} onRemove={onRemove} onReceipt={onReceipt} />
          ))}
        </ul>
      )}

      {realized.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Gerealiseerd ({realized.length}) — telt niet meer mee in de projectie
          </summary>
          <ul className="mt-2 divide-y divide-white/10 border border-white/10 bg-mission-panel">
            {realized.map((bon) => (
              <BonRow key={bon.id} bon={bon} onRealize={onRealize} onReopen={onReopen} onRemove={onRemove} onReceipt={onReceipt} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
