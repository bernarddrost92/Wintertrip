import { MONTH_LABELS_NL } from '../config/scoringConfig';

interface LeagueTimelineProps {
  /** Absolute month indices (year*12+month-1) that fall inside the league AND the deal. */
  activeMonthIndices: number[];
  /** The five league month indices, in order (Sep..Jan). */
  leagueMonthIndices: number[];
}

export function LeagueTimeline({ activeMonthIndices, leagueMonthIndices }: LeagueTimelineProps) {
  const activeSet = new Set(activeMonthIndices);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2" role="img" aria-label="League-maanden tijdlijn">
      {leagueMonthIndices.map((idx) => {
        const active = activeSet.has(idx);
        const month = ((idx % 12) + 12) % 12;
        return (
          <div key={idx} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`h-2 w-full rounded-full transition-colors duration-300 ${
                active ? 'bg-gold-sweep shadow-gold' : 'bg-white/10'
              }`}
            />
            <span className={`text-[10px] font-semibold tracking-wider ${active ? 'text-gold' : 'text-ink-muted'}`}>
              {MONTH_LABELS_NL[month]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
