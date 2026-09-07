import { Radar, TrendingUp, Users, FileCheck2, Clock, Target } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

const AGENDA_ITEMS = [
  { icon: TrendingUp, label: 'Scoreontwikkeling' },
  { icon: Target, label: 'Positie' },
  { icon: Radar, label: 'Factor' },
  { icon: Users, label: 'Contractantengroei' },
  { icon: FileCheck2, label: 'Nieuwe plaatsingen & verlengingen' },
  { icon: Clock, label: 'Aflopende opdrachten' },
  { icon: FileCheck2, label: 'League Checks' },
  { icon: Target, label: 'Grootste kansen komende week' },
];

export function WeeklyBriefing() {
  return (
    <div className="panel p-5 sm:p-6">
      <SectionHeader eyebrow="Weekritme" title="Weekly Briefing" subtitle="Iedere week bespreken we samen:" />
      <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {AGENDA_ITEMS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2.5 rounded-md border border-white/10 bg-mission-raised/50 px-3 py-2.5">
            <Icon size={16} className="shrink-0 text-gold" aria-hidden />
            <span className="text-sm text-ink">{label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t border-white/10 pt-4 text-center font-display text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        No surprises. No missed points. One team.
      </p>
    </div>
  );
}
