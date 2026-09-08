import { Leaderboard } from '../../components/Leaderboard';
import { SectionHeader } from '../../components/SectionHeader';
import type { AccountManagerStats } from '../../types/league';
import { formatPoints, formatSignedPoints } from '../../utils/format';

export function AmLeaderboardSection({ accountManagers }: { accountManagers: AccountManagerStats[] }) {
  const rows = accountManagers.map((am) => ({
    name: am.name,
    finalScore: am.finalScore,
    detailLines: [
      { label: 'Nieuwe plaatsingen', value: `${am.newPlacements}` },
      { label: 'Verlengingen', value: `${am.extensions}` },
      { label: 'Urenuitbreidingen', value: `${am.hoursIncreases}` },
      { label: 'Basisscore', value: formatPoints(am.baseScore) },
      { label: 'Factor-impact', value: formatSignedPoints(am.factorImpact) },
      { label: 'Eindscore', value: formatPoints(am.finalScore) },
    ],
  }));

  return (
    <div className="panel p-5 sm:p-6">
      <SectionHeader eyebrow="Bijdrage per persoon" title="AM Leaderboard" subtitle="Samen scherp. Samen #1." />
      <div className="mt-5">
        <Leaderboard rows={rows} role="AM" />
      </div>
    </div>
  );
}
