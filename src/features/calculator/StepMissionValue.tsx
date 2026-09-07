import { AlertTriangle } from 'lucide-react';
import { FactorComparison } from '../../components/FactorComparison';
import { LeagueTimeline } from '../../components/LeagueTimeline';
import { MissionMetric } from '../../components/MissionMetric';
import { ScoreReveal } from '../../components/ScoreReveal';
import { SectionHeader } from '../../components/SectionHeader';
import { LEAGUE_PERIOD, WS_WARNING_MESSAGE } from '../../config/scoringConfig';
import { activeLeagueMonthIndices, monthIndexRange } from '../../utils/dates';
import { formatFactor, formatPoints, formatSignedPoints } from '../../utils/format';
import { TimingImpact } from './TimingImpact';
import type { CalculatorResult } from './useMissionCalculator';

interface StepMissionValueProps {
  result: CalculatorResult;
}

export function StepMissionValue({ result }: StepMissionValueProps) {
  const { breakdown, wsWarning, hoursTooSmall, hoursIncreaseAmount, effectiveStartDate, effectiveEndDate } = result;

  if (wsWarning) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-gold/40 bg-gold/10 px-5 py-4 text-sm text-gold">
        <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden />
        <p>{WS_WARNING_MESSAGE}</p>
      </div>
    );
  }

  if (hoursTooSmall) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-gold/40 bg-gold/10 px-5 py-4 text-sm text-gold">
        <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden />
        <p>
          NIET SCOREBAAR — een urenstijging van {hoursIncreaseAmount} u/w haalt de minimale drempel van 4 u/w niet.
        </p>
      </div>
    );
  }

  if (!breakdown) {
    return <p className="text-sm text-ink-muted">Vul eerst de missiegegevens in om de Mission Value te berekenen.</p>;
  }

  const leagueMonthIndices = monthIndexRange(LEAGUE_PERIOD.start, LEAGUE_PERIOD.end);
  const activeMonths =
    effectiveStartDate && effectiveEndDate
      ? activeLeagueMonthIndices(effectiveStartDate, effectiveEndDate, LEAGUE_PERIOD.start, LEAGUE_PERIOD.end)
      : [];

  return (
    <div className="space-y-6">
      <ScoreReveal label="Mission Value" value={breakdown.finalScore} />

      <div className="panel p-5 sm:p-6">
        <SectionHeader eyebrow="Berekening" title="Score Breakdown" />
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-4">
          <MissionMetric label="Looptijd" value={`${breakdown.durationMonths}`} sub="maanden" />
          <span className="font-display text-xl text-ink-muted">×</span>
          <MissionMetric label="VCDB" value={`${breakdown.scorePerLeagueMonth / (breakdown.durationMonths || 1)}`} sub="per maand" />
          <span className="font-display text-xl text-ink-muted">=</span>
          <MissionMetric label="Per league-maand" value={formatPoints(breakdown.scorePerLeagueMonth)} tone="gold" />
          <span className="font-display text-xl text-ink-muted">×</span>
          <MissionMetric label="League-maanden" value={`${breakdown.leagueMonths}`} />
        </div>

        <div className="my-5 h-px bg-white/10" />

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <MissionMetric label="Mission Base Value" value={formatPoints(breakdown.baseScore)} size="lg" />
        </div>

        <div className="mt-5">
          <p className="label-classified mb-2">League tijdlijn</p>
          <LeagueTimeline activeMonthIndices={activeMonths} leagueMonthIndices={leagueMonthIndices} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel-inset px-4 py-4">
          <MissionMetric label="Basisscore" value={formatPoints(breakdown.baseScore)} />
        </div>
        <div className="panel-inset px-4 py-4">
          <MissionMetric label="Factor" value={formatFactor(breakdown.factor)} />
        </div>
        <div className="panel-inset border-gold/30 px-4 py-4">
          <MissionMetric label="Factor Impact" value={formatSignedPoints(breakdown.factorImpact)} tone="gold" />
        </div>
      </div>

      <FactorComparison baseScore={breakdown.baseScore} selectedFactor={breakdown.factor} />

      <TimingImpact
        durationMonths={breakdown.durationMonths}
        vcdbPerMonth={breakdown.durationMonths > 0 ? breakdown.scorePerLeagueMonth / breakdown.durationMonths : 0}
        currentStartDate={effectiveStartDate ?? undefined}
      />
    </div>
  );
}
