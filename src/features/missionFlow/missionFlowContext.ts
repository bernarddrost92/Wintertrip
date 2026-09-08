import { createContext, useContext } from 'react';
import type { CalculatorForm } from '../calculator/useMissionControlCalculator';
import type { ScoreResult } from '../../types/scoring';

/**
 * The frozen "BEFORE CHECK" state of a deal, captured the moment the
 * Accountmanager hits RUN LEAGUE CHECK — the exact form inputs and the
 * Base Score / Mission Value they produced, kept untouched so the League
 * Check's AFTER CHECK editor can compare like-for-like once the deal has
 * possibly been improved.
 */
export interface BeforeCheckSnapshot {
  form: CalculatorForm;
  result: ScoreResult;
}

export interface MissionFlowContextValue {
  beforeCheck: BeforeCheckSnapshot | null;
  setBeforeCheck: (snapshot: BeforeCheckSnapshot) => void;
  clearBeforeCheck: () => void;
}

export const MissionFlowContext = createContext<MissionFlowContextValue | null>(null);

export function useMissionFlow(): MissionFlowContextValue {
  const ctx = useContext(MissionFlowContext);
  if (!ctx) throw new Error('useMissionFlow must be used within a MissionFlowProvider');
  return ctx;
}
