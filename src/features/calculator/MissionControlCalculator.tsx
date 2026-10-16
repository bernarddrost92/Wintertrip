import { useRef } from 'react';
import { CommandFrame } from '../../components/CommandFrame';
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

  const hasResult = output.isInputComplete;

  return (
    <CommandFrame>
      <div className="mx-auto max-w-[1800px] space-y-4 px-4 py-5 sm:px-6 sm:py-7">
        {/* 1. Kies actie */}
        <MissionTypeToggle value={form.missionType} onChange={setMissionType} />

        {/* 2. Vul gegevens in → 3. score. Progressive disclosure: before the
            input is complete only the form and one calm line show; the
            score, the check and the month breakdown appear once there is
            something to show. */}
        <div className={`grid gap-4 ${hasResult ? 'lg:grid-cols-[340px_minmax(0,1fr)_300px]' : 'lg:grid-cols-[400px_minmax(0,1fr)]'}`}>
          <div>
            <MissionInputPanel form={form} update={update} output={output} />
          </div>
          <div ref={resultRef} className="scroll-mt-24">
            <MissionValuePanel output={output} onRunLeagueCheck={handleRunLeagueCheck} />
          </div>
          {hasResult && (
            <div>
              <ControlCheckPanel output={output} />
            </div>
          )}
        </div>

        {output.result && <MonthlyIntelligence result={output.result} />}
      </div>
    </CommandFrame>
  );
}
