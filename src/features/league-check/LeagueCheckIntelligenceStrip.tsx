import { useEffect, useState } from 'react';
import { fetchLeagueCheckReceiptStats, type LeagueCheckReceiptStats } from '../../services/leagueCheckReceipts';

type StripStatus = 'loading' | 'unavailable' | 'ready';

function pad2(value: number): string {
  return value < 100 ? String(value).padStart(2, '0') : String(value);
}

interface StatCellProps {
  label: string;
  value: string;
  valueClassName?: string;
  sub?: string;
}

function StatCell({ label, value, valueClassName = 'text-ink', sub }: StatCellProps) {
  return (
    <div className="px-2 py-1 text-center">
      <p className="font-display text-lg font-bold tabular-nums leading-tight sm:text-xl">
        <span className={valueClassName}>{value}</span>
      </p>
      <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{label}</p>
      {sub && <p className="mt-0.5 text-[9px] uppercase tracking-wider text-ink-dim">{sub}</p>}
    </div>
  );
}

/**
 * A compact, secondary quality/control indicator — never the calculator's
 * main event. Deliberately small type, muted labels, and the word "CHECKS"
 * (never "POINTS") so it can't be mistaken for VCDB/Final Score above it.
 * Team-wide counts come straight from the league_check_receipts table
 * (services/leagueCheckReceipts.ts) — the single source of truth; this
 * component never counts anything itself.
 */
export function LeagueCheckIntelligenceStrip() {
  const [status, setStatus] = useState<StripStatus>('loading');
  const [stats, setStats] = useState<LeagueCheckReceiptStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeagueCheckReceiptStats().then((result) => {
      if (cancelled) return;
      if (result) {
        setStats(result);
        setStatus('ready');
      } else {
        setStatus('unavailable');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'unavailable') return null;

  return (
    <div className="relative border-b border-gold/10 bg-mission-panel/40 px-4 py-3 sm:px-6">
      <p className="text-center text-[9px] font-bold uppercase tracking-[0.28em] text-ink-dim">League Check Intelligence</p>
      <p className="mt-0.5 text-center text-[9px] uppercase tracking-wider text-ink-dim/80">Kwaliteitscontrole — geen league score</p>

      {status === 'loading' && (
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-2 sm:grid-cols-4">
          {['RECEIPTS', 'CHECKS', 'APPROVED', 'OPEN'].map((label) => (
            <StatCell key={label} label={label} value="—" valueClassName="text-ink-dim" />
          ))}
        </div>
      )}

      {status === 'ready' && stats && (
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-2 sm:grid-cols-4">
          <StatCell label="Receipts" value={pad2(stats.totalReceipts)} valueClassName="text-ink" />
          <StatCell
            label="Checks"
            value={`${stats.completedChecks} / ${stats.maxChecks}`}
            valueClassName="text-gold"
            sub={`${stats.completionPercentage}% checked`}
          />
          <StatCell label="Approved" value={pad2(stats.approvedCount)} valueClassName="text-emerald-400" />
          <StatCell label="Open" value={pad2(stats.openCount)} valueClassName="text-amber-400" sub={`${stats.openChecks} open checks`} />
        </div>
      )}
    </div>
  );
}
