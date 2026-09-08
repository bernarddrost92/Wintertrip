import { createContext, useContext } from 'react';
import type { CalculatorForm } from '../calculator/useMissionControlCalculator';
import type { ScoreResult } from '../../types/scoring';
import type { AgentRole } from '../../types/league';

export type { AgentRole };

/**
 * The frozen "BEFORE CHECK" state of a deal, captured the moment the
 * AM or TM hits RUN LEAGUE CHECK — the exact form inputs and the
 * Base Score / Mission Value they produced, kept untouched so the League
 * Check's AFTER CHECK editor can compare like-for-like once the deal has
 * possibly been improved.
 */
export interface BeforeCheckSnapshot {
  form: CalculatorForm;
  result: ScoreResult;
}

/**
 * Who ran the check, what they are (AM or TM), and which professional the
 * deal is for — entered once on the League Check page but needed all the
 * way through to the Mission Receipt, its downloaded PNG and the WhatsApp
 * text, so it lives here rather than as page-local state that would be
 * lost on navigating away and back.
 */
export interface AgentIdentity {
  agentName: string;
  agentRole: AgentRole;
  professionalName: string;
}

export const INITIAL_AGENT_IDENTITY: AgentIdentity = {
  agentName: '',
  agentRole: 'AM',
  professionalName: '',
};

export interface MissionFlowContextValue {
  beforeCheck: BeforeCheckSnapshot | null;
  setBeforeCheck: (snapshot: BeforeCheckSnapshot) => void;
  clearBeforeCheck: () => void;
  agent: AgentIdentity;
  updateAgent: <K extends keyof AgentIdentity>(key: K, value: AgentIdentity[K]) => void;
  resetAgent: () => void;
}

export const MissionFlowContext = createContext<MissionFlowContextValue | null>(null);

export function useMissionFlow(): MissionFlowContextValue {
  const ctx = useContext(MissionFlowContext);
  if (!ctx) throw new Error('useMissionFlow must be used within a MissionFlowProvider');
  return ctx;
}
