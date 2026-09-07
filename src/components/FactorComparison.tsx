import { calculateFactorComparison } from '../services/scoring';
import { formatFactor, formatPoints, formatSignedPoints } from '../utils/format';
import { SectionHeader } from './SectionHeader';

interface FactorComparisonProps {
  baseScore: number;
  selectedFactor: number;
}

export function FactorComparison({ baseScore, selectedFactor }: FactorComparisonProps) {
  const rows = calculateFactorComparison(baseScore, selectedFactor);
  const noFactorRow = rows.find((r) => r.value === 1.0);
  const selectedRow = rows.find((r) => r.isSelected);
  const impactVsNoFactor =
    selectedRow && noFactorRow ? selectedRow.finalScore - noFactorRow.finalScore : 0;

  return (
    <div className="panel p-5 sm:p-6">
      <SectionHeader
        eyebrow="Simulatie"
        title="Compare Factors"
        subtitle="Zelfde basisscore, elk ranking-scenario naast elkaar."
      />
      <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map((row) => (
          <li
            key={row.position + row.value}
            className={`rounded-md border px-3 py-3 transition-colors ${
              row.isSelected ? 'border-gold bg-gold/10 shadow-gold' : 'border-white/10 bg-mission-raised/60'
            }`}
          >
            <p className={`label-classified ${row.isSelected ? 'text-gold' : ''}`}>{formatFactor(row.value)}</p>
            <p className={`mt-1 font-display text-xl font-semibold tabular-nums ${row.isSelected ? 'text-gold' : 'text-ink'}`}>
              {formatPoints(row.finalScore)}
            </p>
          </li>
        ))}
      </ul>
      {selectedRow && selectedRow.value !== 1.0 && (
        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/10 pt-4">
          <span className="label-classified">
            {selectedRow.position} FACTOR EFFECT VS. ZONDER FACTOR
          </span>
          <span className="font-display text-2xl font-semibold text-gold tabular-nums">
            {formatSignedPoints(impactVsNoFactor)}
          </span>
        </div>
      )}
    </div>
  );
}
