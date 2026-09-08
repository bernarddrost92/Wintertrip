import { useState, type ReactNode } from 'react';
import { MissionFlowContext, type BeforeCheckSnapshot } from './missionFlowContext';

/**
 * Carries the BEFORE CHECK snapshot from the Mission Calculator across to
 * the League Check page — the two features stay independent components,
 * but share this one piece of session state so RUN LEAGUE CHECK really
 * continues the same mission rather than starting a disconnected page.
 */
export function MissionFlowProvider({ children }: { children: ReactNode }) {
  const [beforeCheck, setBeforeCheckState] = useState<BeforeCheckSnapshot | null>(null);

  function setBeforeCheck(snapshot: BeforeCheckSnapshot) {
    setBeforeCheckState(snapshot);
  }

  function clearBeforeCheck() {
    setBeforeCheckState(null);
  }

  return (
    <MissionFlowContext.Provider value={{ beforeCheck, setBeforeCheck, clearBeforeCheck }}>{children}</MissionFlowContext.Provider>
  );
}
