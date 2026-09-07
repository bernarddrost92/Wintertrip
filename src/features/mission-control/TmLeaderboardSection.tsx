import { Leaderboard } from '../../components/Leaderboard';
import { SectionHeader } from '../../components/SectionHeader';
import type { TalentManagerStats } from '../../types/league';
import { formatPoints, formatSignedPoints } from '../../utils/format';

export function TmLeaderboardSection({ talentManagers }: { talentManagers: TalentManagerStats[] }) {
  const rows = talentManagers.map((tm) => ({
    name: tm.name,
    finalScore: tm.finalScore,
    detailLines: [
      { label: 'Nieuwe contractanten', value: `${tm.newContractors}` },
      { label: 'Ondersteunde plaatsingen', value: `${tm.placementsSupported}` },
      { label: 'Basisscore', value: formatPoints(tm.baseScore) },
      { label: 'Factor-impact', value: formatSignedPoints(tm.factorImpact) },
      { label: 'Eindscore', value: formatPoints(tm.finalScore) },
    ],
  }));

  return (
    <div className="panel p-5 sm:p-6">
      <SectionHeader
        eyebrow="Bijdrage per persoon"
        title="TM Leaderboard"
        subtitle="Wat heeft iedere talentmanager bijgedragen aan Team Zwolle?"
      />
      <div className="mt-5">
        <Leaderboard rows={rows} />
      </div>
    </div>
  );
}
