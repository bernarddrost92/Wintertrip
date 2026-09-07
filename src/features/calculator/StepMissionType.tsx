import { CalendarPlus, Clock4, RefreshCw } from 'lucide-react';
import { MissionCard } from '../../components/MissionCard';
import type { MissionType } from '../../types/league';

interface StepMissionTypeProps {
  value: MissionType | null;
  onSelect: (type: MissionType) => void;
}

const OPTIONS: { type: MissionType; title: string; description: string; icon: typeof CalendarPlus }[] = [
  { type: 'NEW_PLACEMENT', title: 'Nieuwe plaatsing', description: 'Een volledig nieuwe opdracht binnen de league.', icon: CalendarPlus },
  { type: 'EXTENSION', title: 'Verlenging', description: 'Alleen de nieuw toegevoegde maanden tellen mee.', icon: RefreshCw },
  { type: 'HOURS_INCREASE', title: 'Urenuitbreiding', description: 'Vanaf +4 uur per week scoorbaar.', icon: Clock4 },
];

export function StepMissionType({ value, onSelect }: StepMissionTypeProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {OPTIONS.map((opt) => (
        <MissionCard
          key={opt.type}
          icon={<opt.icon size={20} />}
          title={opt.title}
          description={opt.description}
          selected={value === opt.type}
          onClick={() => onSelect(opt.type)}
        />
      ))}
    </div>
  );
}
