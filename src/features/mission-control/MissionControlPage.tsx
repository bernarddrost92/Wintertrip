import { RadarBackground } from '../../components/RadarBackground';
import { MissionMetric } from '../../components/MissionMetric';
import { SectionHeader } from '../../components/SectionHeader';
import { WeeklyBriefing } from '../../components/WeeklyBriefing';
import { isLiveApiConfigured } from '../../services/api';
import { formatFactor, formatPoints, formatSignedPoints } from '../../utils/format';
import { AmLeaderboardSection } from './AmLeaderboardSection';
import { TmLeaderboardSection } from './TmLeaderboardSection';
import { WeeklyMissionUpdateSection } from './WeeklyMissionUpdateSection';
import { useLeagueDataset } from './useLeagueDataset';

export function MissionControlPage() {
  const { dataset, loading } = useLeagueDataset();

  if (loading || !dataset) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-24 text-center">
        <p className="label-classified animate-pulse-glow">Decrypting mission data…</p>
      </div>
    );
  }

  const { team, accountManagers, talentManagers, weeklyUpdate, weeklyScoreHistory } = dataset;

  return (
    <div className="relative">
      <section className="relative overflow-hidden border-b border-gold/10 px-4 py-14 sm:px-6">
        <RadarBackground className="opacity-60" />
        <div className="relative mx-auto max-w-6xl">
          <SectionHeader eyebrow={team.teamName} title="Mission Control" subtitle="We maken de score zichtbaar." />
          {!isLiveApiConfigured() && (
            <p className="label-classified mt-3 text-ink-muted">Databron: mockdata (geen VITE_LEAGUE_API_URL geconfigureerd)</p>
          )}

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div className="panel px-5 py-5">
              <MissionMetric label="Current Position" value={`#${team.currentPosition}`} size="lg" tone="gold" />
            </div>
            <div className="panel px-5 py-5">
              <MissionMetric label="Mission Score" value={formatPoints(team.missionScore)} size="lg" />
            </div>
            <div className="panel px-5 py-5">
              <MissionMetric label="Current Factor" value={formatFactor(team.currentFactor)} size="lg" />
            </div>
            <div className="panel px-5 py-5">
              <MissionMetric label="Contractant Position" value={`#${team.contractorPosition}`} size="lg" tone="gold" />
            </div>
            <div className="panel px-5 py-5">
              <MissionMetric label="Weekly Growth" value={formatSignedPoints(team.weeklyGrowth)} size="lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <WeeklyMissionUpdateSection update={weeklyUpdate} history={weeklyScoreHistory} />

        <div className="grid gap-6 lg:grid-cols-2">
          <AmLeaderboardSection accountManagers={accountManagers} />
          <TmLeaderboardSection talentManagers={talentManagers} />
        </div>

        <WeeklyBriefing />
      </section>
    </div>
  );
}
