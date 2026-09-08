import { useMemo, useState } from 'react';
import { computeResultForForm } from '../calculator/computeResult';
import { calculateFoundPoints, type FoundPoints } from '../../services/missionReceipt';
import type { CalculatorForm } from '../calculator/useMissionControlCalculator';
import type { BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';
import type { ScoreResult } from '../../types/scoring';

export interface AfterCheckOutput {
  form: CalculatorForm;
  update: <K extends keyof CalculatorForm>(key: K, value: CalculatorForm[K]) => void;
  result: ScoreResult;
  found: FoundPoints;
}

/**
 * The AFTER CHECK editor's state: starts as an exact copy of the BEFORE
 * CHECK form (so "no change" is the default, honest starting point — see
 * services/missionReceipt.ts), recomputed live through the very same
 * scoring functions as the calculator itself. Found points are always
 * derived strictly from the Base Score delta, never from the Mission Value
 * delta, so a Factor change alone can never read as League Check winnings.
 */
export function useAfterCheck(beforeCheck: BeforeCheckSnapshot): AfterCheckOutput {
  const [form, setForm] = useState<CalculatorForm>(beforeCheck.form);

  function update<K extends keyof CalculatorForm>(key: K, value: CalculatorForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const result = useMemo(() => computeResultForForm(form), [form]);
  const found = useMemo(
    () => calculateFoundPoints(beforeCheck.result.baseScore, result.baseScore, form.factor),
    [beforeCheck.result.baseScore, result.baseScore, form.factor],
  );

  return { form, update, result, found };
}
