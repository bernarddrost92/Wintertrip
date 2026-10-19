import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { calculateScoreLead, getPodiumState } from '../../services/podiumStatus';
import type { PodiumState } from '../../services/podiumStatus';
import { formatFactor, formatVcdbValue } from '../../utils/format';
import type { FteSnapshot, PowerBiIntelligenceSnapshot, RankingSnapshot } from '../../types/missionSnapshot';

type MedalState = Exclude<PodiumState, 'awaiting'>;

const STATE_LABEL: Record<MedalState, string> = {
  gold: 'Goud',
  silver: 'Zilver',
  bronze: 'Brons',
  default: 'Op jacht',
};

const CARD_CLASSES: Record<MedalState, string> = {
  gold: 'border-gold/50 shadow-podium-gold',
  silver: 'border-silver/40 shadow-podium-silver',
  bronze: 'border-bronze/40 shadow-podium-bronze',
  default: 'border-white/[0.07]',
};

const NUMBER_CLASSES: Record<MedalState, string> = {
  gold: 'text-gold-bright',
  silver: 'text-silver',
  bronze: 'text-bronze',
  default: 'text-ink',
};

interface CommandBriefingCardProps {
  ranking: RankingSnapshot;
  powerBi: PowerBiIntelligenceSnapshot;
  fte: FteSnapshot;
  /** The team directly above Zwolle in the Final Ranking — null at #1. */
  teamAbove?: { team: string; position: number; finalScore: number } | null;
}

/**
 * The compact 007 Command Briefing — Team Zwolle's virtual League position
 * (same podium effect as before: gold pulse/glow/flare for #1, a quieter
 * silver/bronze for #2/#3, a plain card for #4+), the Power BI Virtual
 * Final Score, the lead over #2, FTE ranking position, current FTE
 * factor, and a compact Pursuit strip over the current Top 3 — one glance
 * answers "where do we stand," replacing what used to be two separate,
 * much taller cards. Never fabricates a position or score: with no
 * snapshot loaded this reads Awaiting Intelligence instead.
 */
export function CommandBriefingCard({ ranking, powerBi, fte, teamAbove = null }: CommandBriefingCardProps) {
  const state = getPodiumState(ranking.virtualPosition);
  const leader = powerBi.topThree[0] ?? null;
  const second = powerBi.topThree[1] ?? null;
  // At #1: the lead over #2. Below #1: the gap to the team directly above.
  const lead = ranking.virtualPosition === 1 ? calculateScoreLead(powerBi.finalScore, second?.finalScore ?? null) : null;
  const gapAbove = teamAbove ? calculateScoreLead(teamAbove.finalScore, powerBi.finalScore) : null;

  if (state === 'awaiting') {
    return (
      <div className="panel p-5 sm:p-7" data-podium-state="awaiting">
        <p className="label-classified">Command Briefing</p>
        <p className="mt-2 font-display text-lg font-semibold uppercase tracking-wide text-ink-muted">Awaiting Intelligence</p>
      </div>
    );
  }

  return (
    <div className={`panel mission-accent-line relative overflow-hidden p-5 sm:p-7 ${CARD_CLASSES[state]}`} data-podium-state={state} data-demo="mc-briefing">
      {/* One static wash per podium state — no pulse, flare or shimmer
          loops on a screen people look at every day. */}
      {state !== 'default' && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 80% at 15% 0%, ${
              state === 'gold' ? 'rgba(214,174,85,0.1)' : state === 'silver' ? 'rgba(232,236,240,0.07)' : 'rgba(205,127,50,0.07)'
            }, transparent 60%)`,
          }}
          aria-hidden
        />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div data-demo="mc-position">
          <p className="stat-label">Positie</p>
          <p className={`mt-1 font-display text-5xl font-black leading-none tabular-nums sm:text-6xl ${NUMBER_CLASSES[state]}`}>
            #{ranking.virtualPosition}
          </p>
          <p className="label-classified mt-1">{STATE_LABEL[state]}</p>
        </div>
        <div className="text-right" data-demo="mc-final">
          <p className="stat-label">Final Score</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-ink sm:text-4xl">
            {powerBi.finalScore != null ? formatVcdbValue(powerBi.finalScore) : '—'}
          </p>
        </div>
      </div>

      {(lead !== null || gapAbove !== null || fte.netFteRanking != null || fte.currentFteFactor != null) && (
        <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-xs" data-demo="mc-strip">
          {lead !== null && second && (
            <p className="text-sm font-semibold text-gold">
              +{formatVcdbValue(lead)} vs #2 {second.team}
            </p>
          )}
          {gapAbove !== null && teamAbove && (
            <p className="text-sm font-semibold text-gold">
              −{formatVcdbValue(gapAbove)} vs #{teamAbove.position} {teamAbove.team}
            </p>
          )}
          {(fte.netFteRanking != null || fte.currentFteFactor != null) && (
            <p className="text-[13px] font-medium text-ink-muted">
              {[
                powerBi.vcdbRanking != null && `VCDB #${powerBi.vcdbRanking}`,
                fte.netFteRanking != null && `Net FTE #${fte.netFteRanking}`,
                fte.currentFteFactor != null && `Factor ${formatFactor(fte.currentFteFactor)}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      )}

      {powerBi.topThree.length > 0 && (
        <ul className="relative mt-3 divide-y divide-white/10 border-t border-white/10">
          {powerBi.topThree.map((entry) => {
            const isLeader = entry.position === 1;
            const isOwn = entry.team === OWN_TEAM;
            const deltaVsLeader = isLeader ? null : calculateScoreLead(leader?.finalScore ?? null, entry.finalScore);
            return (
              <li key={entry.position} className="flex items-center justify-between gap-3 py-1.5">
                <span className={`text-sm font-semibold ${isOwn ? 'text-gold' : 'text-ink-muted'}`}>
                  {entry.position} · {entry.team}
                </span>
                <span className="text-right">
                  <span className={`font-display text-sm font-semibold tabular-nums ${isOwn ? 'text-gold' : 'text-ink'}`}>
                    {formatVcdbValue(entry.finalScore)}
                  </span>
                  {deltaVsLeader !== null && <span className="ml-2 text-[11px] text-ink-muted">−{formatVcdbValue(deltaVsLeader)}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
