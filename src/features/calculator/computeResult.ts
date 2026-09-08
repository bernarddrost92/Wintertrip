import { calculateExtensionScore, calculateHoursIncreaseScore, calculateNewPlacementScore, evaluateExtensionTiming } from '../../services/scoring';
import type { ScoreResult } from '../../types/scoring';
import type { IsoDate } from '../../types/league';
import { isValidIsoDate } from '../../utils/dates';
import { toNumber, type CalculatorForm } from './useMissionControlCalculator';

/**
 * Computes the ScoreResult for a given form snapshot, dispatching to
 * exactly the same scoring functions the live calculator uses — the one
 * place that maps a CalculatorForm to a score, so the AFTER CHECK editor
 * (services/missionReceipt.ts's consumer) can never drift from the
 * calculator's own math.
 */
export function computeResultForForm(form: CalculatorForm): ScoreResult {
  if (form.missionType === 'NEW_PLACEMENT') {
    return calculateNewPlacementScore(form.startDate, form.endDate, toNumber(form.vcdbPerMonth), form.factor, form.dealCategory);
  }
  if (form.missionType === 'EXTENSION') {
    return calculateExtensionScore(form.oldEndDate, form.newEndDate, toNumber(form.extensionVcdbPerMonth), form.factor, form.dealCategory);
  }
  return calculateHoursIncreaseScore(
    toNumber(form.oldHours),
    toNumber(form.newHours),
    form.increaseStartDate,
    form.increaseEndDate,
    toNumber(form.extraVcdbPerMonth),
    form.factor,
    form.dealCategory,
  );
}

/**
 * The exact day-level start/end of a form's qualifying term, for display
 * (e.g. the Mission Receipt) — not derived from qualifyingTerm.segments,
 * which only carry month-level granularity. EXTENSION's start is always
 * the auto-derived new term start, never the raw old end date.
 */
export function getQualifyingTermRange(form: CalculatorForm): { start: IsoDate; end: IsoDate } | null {
  if (form.missionType === 'NEW_PLACEMENT') {
    if (!isValidIsoDate(form.startDate) || !isValidIsoDate(form.endDate)) return null;
    return { start: form.startDate, end: form.endDate };
  }
  if (form.missionType === 'EXTENSION') {
    if (!isValidIsoDate(form.oldEndDate) || !isValidIsoDate(form.newEndDate)) return null;
    return { start: evaluateExtensionTiming(form.oldEndDate).newTermStart, end: form.newEndDate };
  }
  if (!isValidIsoDate(form.increaseStartDate) || !isValidIsoDate(form.increaseEndDate)) return null;
  return { start: form.increaseStartDate, end: form.increaseEndDate };
}
