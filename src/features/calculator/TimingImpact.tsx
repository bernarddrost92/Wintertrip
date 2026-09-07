import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SectionHeader } from '../../components/SectionHeader';
import { calculateTimingScenarios } from '../../services/scoring';
import { formatPoints, formatSignedPoints } from '../../utils/format';
import { parseIsoDate } from '../../utils/dates';

interface TimingImpactProps {
  durationMonths: number;
  vcdbPerMonth: number;
  /** ISO start date of the current deal, used to highlight its scenario. */
  currentStartDate?: string;
}

export function TimingImpact({ durationMonths, vcdbPerMonth, currentStartDate }: TimingImpactProps) {
  const scenarios = calculateTimingScenarios(durationMonths, vcdbPerMonth);
  if (scenarios.length === 0) return null;

  const currentMonthIndex = currentStartDate
    ? (() => {
        const { year, month } = parseIsoDate(currentStartDate);
        return year * 12 + (month - 1);
      })()
    : undefined;

  const best = scenarios[0];
  const worst = scenarios[scenarios.length - 1];
  const current =
    currentMonthIndex !== undefined
      ? scenarios.find((s) => s.monthIndex === currentMonthIndex)
      : undefined;
  // When the deal already starts in the best-possible month, compare against
  // the worst case instead so the panel still shows the range of the timing
  // effect rather than a trivial "vs. itself" comparison.
  const comparisonTarget = current && current.monthIndex !== best.monthIndex ? current : worst;
  const difference = best.baseScore - comparisonTarget.baseScore;

  return (
    <div className="panel p-5 sm:p-6">
      <SectionHeader
        eyebrow="Timing is alles"
        title="Timing Impact"
        subtitle="Zelfde deal, ander startmoment — dit is wat vroeg scoren oplevert."
      />
      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scenarios} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="monthLabel" tick={{ fill: '#8E929B', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
            <YAxis
              tick={{ fill: '#8E929B', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(value: number) => formatPoints(value)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(232,184,62,0.06)' }}
              contentStyle={{ background: '#0D1118', border: '1px solid rgba(232,184,62,0.3)', borderRadius: 8 }}
              labelStyle={{ color: '#F4C95D' }}
              itemStyle={{ color: '#F7F3E8' }}
              formatter={(value: number) => [formatPoints(value), 'Basisscore']}
            />
            <Bar dataKey="baseScore" radius={[4, 4, 0, 0]}>
              {scenarios.map((s) => (
                <Cell
                  key={s.monthLabel}
                  fill={s.monthIndex === currentMonthIndex ? '#F4C95D' : 'rgba(232,184,62,0.35)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/10 pt-4">
        <span className="label-classified">
          START {best.monthLabel} vs. START {comparisonTarget.monthLabel}
        </span>
        <span className="font-display text-xl font-semibold text-gold tabular-nums">
          {formatSignedPoints(difference)}
        </span>
      </div>
    </div>
  );
}
