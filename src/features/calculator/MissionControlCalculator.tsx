import { MissionSerial } from '../../components/MissionSerial';
import { TacticalGrid } from '../../components/TacticalGrid';
import { ControlCheckPanel } from './ControlCheckPanel';
import { MissionInputPanel } from './MissionInputPanel';
import { MissionTypeToggle } from './MissionTypeToggle';
import { MissionValuePanel } from './MissionValuePanel';
import { MonthlyIntelligence } from './MonthlyIntelligence';
import { useMissionControlCalculator } from './useMissionControlCalculator';

export function MissionControlCalculator() {
  const { form, update, setMissionType, output } = useMissionControlCalculator();

  return (
    <div className="relative">
      <div className="relative overflow-hidden border-b border-gold/10 px-4 py-5 sm:px-6">
        <TacticalGrid className="opacity-25" />
        <div className="relative mx-auto max-w-[1800px]">
          <MissionSerial />
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <MissionTypeToggle value={form.missionType} onChange={setMissionType} />

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <div className="order-2 lg:order-1">
            <MissionInputPanel form={form} update={update} output={output} />
          </div>
          <div className="order-1 lg:order-2">
            <MissionValuePanel output={output} />
          </div>
          <div className="order-3">
            <ControlCheckPanel output={output} />
          </div>
        </div>

        <MonthlyIntelligence result={output.result} />
      </div>
    </div>
  );
}
