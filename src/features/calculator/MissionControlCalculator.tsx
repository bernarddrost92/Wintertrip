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

      <div className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6 sm:py-6">
        <MissionTypeToggle value={form.missionType} onChange={setMissionType} />

        {/* Zero-gap grid with hairline-overlapping negative margins: adjacent
            panel borders collapse onto the same pixel, reading as one fused
            console frame instead of separate floating cards with dark gaps
            between them. */}
        <div className="-mt-px grid lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <div className="order-2 lg:order-1 lg:-mr-px">
            <MissionInputPanel form={form} update={update} output={output} />
          </div>
          <div className="relative order-1 lg:order-2 lg:-mx-px">
            <MissionValuePanel output={output} />
          </div>
          <div className="order-3 lg:-ml-px">
            <ControlCheckPanel output={output} />
          </div>
        </div>

        <div className="-mt-px">
          <MonthlyIntelligence result={output.result} />
        </div>
      </div>
    </div>
  );
}
