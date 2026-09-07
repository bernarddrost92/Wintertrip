import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MissionMetric } from '../../components/MissionMetric';
import { SectionHeader } from '../../components/SectionHeader';
import type { WeeklyMissionUpdate, WeeklyScorePoint } from '../../types/league';
import { formatPoints, formatSignedPoints } from '../../utils/format';

interface WeeklyMissionUpdateSectionProps {
  update: WeeklyMissionUpdate;
  history: WeeklyScorePoint[];
}

export function WeeklyMissionUpdateSection({ update, history }: WeeklyMissionUpdateSectionProps) {
  return (
    <div className="panel p-5 sm:p-6">
      <SectionHeader eyebrow={update.weekLabel} title="Weekly Mission Update" subtitle="Iedere week beter." />

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MissionMetric label="Deze week" value={formatSignedPoints(update.pointsThisWeek)} tone="gold" />
        <MissionMetric label="Nieuwe plaatsingen" value={`${update.newPlacements}`} />
        <MissionMetric label="Verlengingen" value={`${update.extensions}`} />
        <MissionMetric label="Nieuwe contractanten" value={`${update.newContractors}`} />
        <MissionMetric label="League Checks" value={`${update.leagueChecks}`} />
        <MissionMetric label="Grootste mission" value={formatSignedPoints(update.biggestDeal)} />
      </div>

      <div className="mt-5 flex items-center justify-between border border-gold/30 bg-gold/5 px-4 py-3">
        <span className="label-classified">Top contributor</span>
        <span className="font-display text-lg font-semibold text-gold">{update.topContributor}</span>
      </div>

      <div className="mt-6 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F4C95D" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#F4C95D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="weekLabel" tick={{ fill: '#8E929B', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
            <YAxis
              tick={{ fill: '#8E929B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(value: number) => formatPoints(value)}
            />
            <Tooltip
              contentStyle={{ background: '#0D1118', border: '1px solid rgba(232,184,62,0.3)', borderRadius: 8 }}
              labelStyle={{ color: '#F4C95D' }}
              itemStyle={{ color: '#F7F3E8' }}
              formatter={(value: number) => [formatPoints(value), 'Score']}
            />
            <Area type="monotone" dataKey="score" stroke="#F4C95D" strokeWidth={2} fill="url(#scoreGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
