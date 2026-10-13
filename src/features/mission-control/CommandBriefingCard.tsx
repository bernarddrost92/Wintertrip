import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { calculateScoreLead, getPodiumState } from '../../services/podiumStatus';
import type { PodiumState } from '../../services/podiumStatus';
import { formatFactor, formatVcdbValue } from '../../utils/format';
import type { FteSnapshot, PowerBiIntelligenceSnapshot, RankingSnapshot } from '../../types/missionSnapshot';

type MedalState = Exclude<PodiumState, 'awaiting'>;

const STATE_LABEL: Record<MedalState, string> = {
  gold: 'Gold Position',
  silver: 'Silver Position',
  bronze: 'Bronze Position',
  default: 'In Pursuit',
};

const CARD_CLASSES: Record<MedalState, string> = {
  gold: 'border-gold/50 shadow-podium-gold',
  silver: 'border-silver/40 shadow-podium-silver',
  bronze: 'border-bronze/40 shadow-podium-bronze',
  default: 'border-gold/15',
};

const NUMBER_CLASSES: Record<MedalState, string> = {
  gold: 'text-gold drop-shadow-[0_0_20px_rgba(241,196,83,0.5)]',
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
      <div className="panel p-4 sm:p-5" data-podium-state="awaiting">
        <p className="label-classified text-gold/70">Command Briefing</p>
        <p className="mt-2 font-display text-lg font-semibold uppercase tracking-wide text-ink-muted">Awaiting Intelligence</p>
      </div>
    );
  }

  return (
    <div className={`panel relative overflow-hidden p-4 sm:p-5 ${CARD_CLASSES[state]}`} data-podium-state={state}>
      {state === 'gold' && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-panel-glow animate-podium-pulse-gold" aria-hidden />
          <div className="podium-flare" aria-hidden />
        </>
      )}
      {state === 'silver' && (
        <div
          className="pointer-events-none absolute inset-0 animate-podium-shimmer-silver"
          style={{ background: 'radial-gradient(120% 80% at 20% 0%, rgba(232,236,240,0.12), transparent 60%)' }}
          aria-hidden
        />
      )}
      {state === 'bronze' && (
        <div
          className="pointer-events-none absolute inset-0 animate-podium-pulse-bronze"
          style={{ background: 'radial-gradient(120% 80% at 20% 0%, rgba(205,127,50,0.1), transparent 60%)' }}
          aria-hidden
        />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="label-classified text-gold/70">Virtual Position</p>
          <p className={`mt-1 font-display text-4xl font-black leading-none tabular-nums sm:text-5xl ${NUMBER_CLASSES[state]}`}>
            #{ranking.virtualPosition}
          </p>
          <p className="label-classified mt-1">{STATE_LABEL[state]}</p>
        </div>
        <div className="text-right">
          <p className="label-classified text-gold/70">Power BI Final</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink sm:text-3xl">
            {powerBi.finalScore != null ? formatVcdbValue(powerBi.finalScore) : '—'}
          </p>
        </div>
      </div>

      {(lead !== null || gapAbove !== null || fte.netFteRanking != null || fte.currentFteFactor != null) && (
        <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-xs">
          {lead !== null && second && (
            <p className="font-semibold uppercase tracking-wide text-gold">
              +{formatVcdbValue(lead)} vs #2 {second.team}
            </p>
          )}
          {gapAbove !== null && teamAbove && (
            <p className="font-semibold uppercase tracking-wide text-gold">
              −{formatVcdbValue(gapAbove)} vs #{teamAbove.position} {teamAbove.team}
            </p>
          )}
          {(fte.netFteRanking != null || fte.currentFteFactor != null) && (
            <p className="label-classified">
              {fte.netFteRanking != null && `FTE Position #${fte.netFteRanking}`}
              {fte.netFteRanking != null && fte.currentFteFactor != null && ' · '}
              {fte.currentFteFactor != null && `Factor ${formatFactor(fte.currentFteFactor)}`}
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
                <span className={`text-xs font-semibold uppercase tracking-wide ${isOwn ? 'text-gold' : 'text-ink-muted'}`}>
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
