import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatPoints } from '../utils/format';

export interface LeaderboardRow {
  name: string;
  finalScore: number;
  detailLines: { label: string; value: string }[];
}

interface LeaderboardProps {
  rows: LeaderboardRow[];
}

export function Leaderboard({ rows }: LeaderboardProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const maxScore = Math.max(1, ...rows.map((r) => r.finalScore));

  return (
    <ul className="space-y-2">
      {rows.map((row, index) => {
        const open = openIndex === index;
        const position = index + 1;
        return (
          <li key={row.name} className="panel-inset overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] sm:px-5"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-sm font-semibold ${
                  position === 1 ? 'border-gold bg-gold/10 text-gold' : 'border-white/15 text-ink-muted'
                }`}
              >
                {position}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-ink sm:text-base">{row.name}</span>
              <div className="hidden w-32 shrink-0 sm:block">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold-sweep"
                    style={{ width: `${Math.max(4, (row.finalScore / maxScore) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="w-20 shrink-0 text-right font-display text-lg font-semibold tabular-nums text-gold sm:text-xl">
                {formatPoints(row.finalScore)}
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {open && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/10 bg-mission-void/40 px-4 py-3 sm:grid-cols-3 sm:px-5">
                {row.detailLines.map((line) => (
                  <div key={line.label}>
                    <dt className="label-classified">{line.label}</dt>
                    <dd className="text-sm font-medium text-ink">{line.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        );
      })}
    </ul>
  );
}
