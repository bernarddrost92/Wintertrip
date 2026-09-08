import { useState, type ReactNode } from 'react';
import { INITIAL_AGENT_IDENTITY, MissionFlowContext, type AgentIdentity, type BeforeCheckSnapshot } from './missionFlowContext';

/**
 * Carries the BEFORE CHECK snapshot and the Agent/Role/Professional
 * identity from the Mission Calculator across to the League Check page and
 * on into the Mission Receipt — the features stay independent components,
 * but share this one piece of session state so RUN LEAGUE CHECK really
 * continues the same mission rather than starting a disconnected page, and
 * the names never go missing partway through the flow.
 */
export function MissionFlowProvider({ children }: { children: ReactNode }) {
  const [beforeCheck, setBeforeCheckState] = useState<BeforeCheckSnapshot | null>(null);
  const [agent, setAgent] = useState<AgentIdentity>(INITIAL_AGENT_IDENTITY);

  function setBeforeCheck(snapshot: BeforeCheckSnapshot) {
    setBeforeCheckState(snapshot);
  }

  function clearBeforeCheck() {
    setBeforeCheckState(null);
  }

  function updateAgent<K extends keyof AgentIdentity>(key: K, value: AgentIdentity[K]) {
    setAgent((prev) => ({ ...prev, [key]: value }));
  }

  function resetAgent() {
    setAgent(INITIAL_AGENT_IDENTITY);
  }

  return (
    <MissionFlowContext.Provider value={{ beforeCheck, setBeforeCheck, clearBeforeCheck, agent, updateAgent, resetAgent }}>
      {children}
    </MissionFlowContext.Provider>
  );
}
