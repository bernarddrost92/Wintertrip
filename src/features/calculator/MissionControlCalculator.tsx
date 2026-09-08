import { useRef } from 'react';
import { CommandFrame } from '../../components/CommandFrame';
import { MissionSerial } from '../../components/MissionSerial';
import { TacticalGrid } from '../../components/TacticalGrid';
import { useAutoScrollOnReady } from '../../hooks/useAutoScrollOnReady';
import { useMissionFlow } from '../missionFlow/missionFlowContext';
import { ControlCheckPanel } from './ControlCheckPanel';
import { MissionInputPanel } from './MissionInputPanel';
import { MissionTypeToggle } from './MissionTypeToggle';
import { MissionValuePanel } from './MissionValuePanel';
import { MonthlyIntelligence } from './MonthlyIntelligence';
import { useMissionControlCalculator } from './useMissionControlCalculator';

interface MissionControlCalculatorProps {
  /** Continues the same mission into League Check — called after the
   * BEFORE CHECK snapshot (this form + its result) has been captured. */
  onRunLeagueCheck: () => void;
}

export function MissionControlCalculator({ onRunLeagueCheck }: MissionControlCalculatorProps) {
  const { form, update, setMissionType, output } = useMissionControlCalculator();
  const { setBeforeCheck } = useMissionFlow();
  const resultRef = useRef<HTMLDivElement>(null);
  useAutoScrollOnReady(resultRef, output.readiness);

  function handleRunLeagueCheck() {
    if (!output.result) return;
    setBeforeCheck({ form, result: output.result });
    onRunLeagueCheck();
  }

  return (
    <CommandFrame>
      <div className="relative overflow-hidden border-b border-gold/15 px-4 py-5 sm:px-6">
        <TacticalGrid className="opacity-25" />
        <div className="relative mx-auto flex max-w-[1800px] flex-col gap-2">
          <p className="label-classified text-gold/70">Operatie Wintertrip 2027 · Mission Calculator</p>
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
          <div ref={resultRef} className="relative order-1 scroll-mt-24 lg:order-2 lg:-mx-px">
            <MissionValuePanel output={output} onRunLeagueCheck={handleRunLeagueCheck} />
          </div>
          <div className="order-3 lg:-ml-px">
            <ControlCheckPanel output={output} />
          </div>
        </div>

        <div className="-mt-px">
          <MonthlyIntelligence result={output.result} />
        </div>
      </div>
    </CommandFrame>
  );
}
