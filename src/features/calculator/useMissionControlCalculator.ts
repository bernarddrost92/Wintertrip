import { useMemo, useState } from 'react';
import { DEFAULT_FACTOR, LEAGUE_PERIOD } from '../../config/leagueRules';
import {
  calculateExtensionScore,
  calculateHoursIncreaseEligibility,
  calculateHoursIncreaseScore,
  calculateNewPlacementScore,
  validateExtensionWindow,
  validateMissionWindow,
  validateVcdb,
} from '../../services/scoring';
import type { MissionType, ScoreResult } from '../../types/scoring';
import { compareIsoDates, isValidIsoDate } from '../../utils/dates';

export interface CalculatorForm {
  missionType: MissionType;
  factor: number;
  // NEW_PLACEMENT
  startDate: string;
  endDate: string;
  vcdbPerMonth: string;
  // EXTENSION
  awardDate: string;
  oldEndDate: string;
  newEndDate: string;
  extensionVcdbPerMonth: string;
  // HOURS_INCREASE
  increaseStartDate: string;
  increaseEndDate: string;
  oldHours: string;
  newHours: string;
  extraVcdbPerMonth: string;
}

const INITIAL_FORM: CalculatorForm = {
  missionType: 'NEW_PLACEMENT',
  factor: DEFAULT_FACTOR.value,
  startDate: '',
  endDate: '',
  vcdbPerMonth: '',
  awardDate: '',
  oldEndDate: '',
  newEndDate: '',
  extensionVcdbPerMonth: '',
  increaseStartDate: '',
  increaseEndDate: '',
  oldHours: '',
  newHours: '',
  extraVcdbPerMonth: '',
};

function toNumber(raw: string): number {
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
}

export interface OpportunitySignal {
  key: string;
  kind: 'ok' | 'warning';
  text: string;
}

export type MissionReadiness = 'INPUT_REQUIRED' | 'INVALID' | 'NOT_ELIGIBLE' | 'READY';

export interface CalculatorOutput {
  result: ScoreResult | null;
  completion: CompletionItem[];
  completeCount: number;
  totalCount: number;
  isInputComplete: boolean;
  errorMessage: string | null;
  hoursEligible: boolean | null;
  opportunities: OpportunitySignal[];
  readiness: MissionReadiness;
}

export function useMissionControlCalculator() {
  const [form, setForm] = useState<CalculatorForm>(INITIAL_FORM);

  function update<K extends keyof CalculatorForm>(key: K, value: CalculatorForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setMissionType(type: MissionType) {
    setForm((prev) => ({ ...INITIAL_FORM, missionType: type, factor: prev.factor }));
  }

  function reset() {
    setForm(INITIAL_FORM);
  }

  const output: CalculatorOutput = useMemo(() => computeOutput(form), [form]);

  return { form, update, setMissionType, reset, output };
}

function computeOutput(form: CalculatorForm): CalculatorOutput {
  if (form.missionType === 'NEW_PLACEMENT') {
    const datesOk = isValidIsoDate(form.startDate) && isValidIsoDate(form.endDate) && compareIsoDates(form.endDate, form.startDate) >= 0;
    const vcdbOk = validateVcdb(toNumber(form.vcdbPerMonth)).valid;
    const completion: CompletionItem[] = [
      { key: 'type', label: 'Mission type', done: true },
      { key: 'dates', label: 'Dates', done: datesOk },
      { key: 'vcdb', label: 'VCDB', done: vcdbOk },
      { key: 'factor', label: 'Factor', done: true },
    ];
    const isInputComplete = completion.every((c) => c.done);
    const windowCheck = validateMissionWindow(form.startDate, form.endDate);

    if (!isInputComplete) {
      return baseOutput(completion, null, windowCheck.valid ? null : windowCheck.message ?? null, null, [], 'INPUT_REQUIRED');
    }

    const result = calculateNewPlacementScore(form.startDate, form.endDate, toNumber(form.vcdbPerMonth), form.factor);
    const opportunities = buildOpportunitySignals(result, form.endDate);
    return baseOutput(completion, result, null, null, opportunities, opportunities.length > 0 ? 'READY' : 'READY');
  }

  if (form.missionType === 'EXTENSION') {
    const datesOk = validateExtensionWindow(form.oldEndDate, form.newEndDate).valid;
    const vcdbOk = validateVcdb(toNumber(form.extensionVcdbPerMonth)).valid;
    const completion: CompletionItem[] = [
      { key: 'type', label: 'Mission type', done: true },
      { key: 'dates', label: 'Dates', done: datesOk },
      { key: 'vcdb', label: 'VCDB', done: vcdbOk },
      { key: 'factor', label: 'Factor', done: true },
    ];
    const isInputComplete = completion.every((c) => c.done);
    const windowCheck = validateExtensionWindow(form.oldEndDate, form.newEndDate);

    if (!isInputComplete) {
      return baseOutput(completion, null, windowCheck.valid ? null : windowCheck.message ?? null, null, [], 'INPUT_REQUIRED');
    }

    const result = calculateExtensionScore(
      form.oldEndDate,
      form.newEndDate,
      toNumber(form.extensionVcdbPerMonth),
      form.factor,
      form.awardDate || undefined,
    );
    const opportunities = buildOpportunitySignals(result, form.newEndDate);
    return baseOutput(completion, result, null, null, opportunities, 'READY');
  }

  // HOURS_INCREASE
  const datesOk =
    isValidIsoDate(form.increaseStartDate) && isValidIsoDate(form.increaseEndDate) && compareIsoDates(form.increaseEndDate, form.increaseStartDate) >= 0;
  const hoursOk = form.oldHours !== '' && form.newHours !== '' && toNumber(form.newHours) > toNumber(form.oldHours);
  const vcdbOk = validateVcdb(toNumber(form.extraVcdbPerMonth)).valid;
  const completion: CompletionItem[] = [
    { key: 'type', label: 'Mission type', done: true },
    { key: 'dates', label: 'Dates', done: datesOk },
    { key: 'hours', label: 'Hours', done: hoursOk },
    { key: 'vcdb', label: 'VCDB', done: vcdbOk },
    { key: 'factor', label: 'Factor', done: true },
  ];
  const isInputComplete = completion.every((c) => c.done);

  if (!isInputComplete) {
    return baseOutput(completion, null, null, null, [], 'INPUT_REQUIRED');
  }

  const eligibility = calculateHoursIncreaseEligibility(toNumber(form.oldHours), toNumber(form.newHours));
  if (!eligibility.eligible) {
    return baseOutput(completion, null, null, false, [], 'NOT_ELIGIBLE');
  }

  const result = calculateHoursIncreaseScore(
    toNumber(form.oldHours),
    toNumber(form.newHours),
    form.increaseStartDate,
    form.increaseEndDate,
    toNumber(form.extraVcdbPerMonth),
    form.factor,
  );
  const opportunities = buildOpportunitySignals(result, form.increaseEndDate);
  return baseOutput(completion, result, null, true, opportunities, 'READY');
}

function baseOutput(
  completion: CompletionItem[],
  result: ScoreResult | null,
  errorMessage: string | null,
  hoursEligible: boolean | null,
  opportunities: OpportunitySignal[],
  readinessIfComplete: MissionReadiness,
): CalculatorOutput {
  const completeCount = completion.filter((c) => c.done).length;
  const isInputComplete = completeCount === completion.length;
  let readiness: MissionReadiness = readinessIfComplete;
  if (!isInputComplete) readiness = 'INPUT_REQUIRED';
  else if (errorMessage) readiness = 'INVALID';
  else if (readinessIfComplete === 'NOT_ELIGIBLE') readiness = 'NOT_ELIGIBLE';

  return {
    result,
    completion,
    completeCount,
    totalCount: completion.length,
    isInputComplete,
    errorMessage,
    hoursEligible,
    opportunities,
    readiness,
  };
}

/**
 * Signals derived strictly from the computed result — never invented. Each
 * one reads directly off the qualifying-term / league-exposure breakdown.
 */
function buildOpportunitySignals(result: ScoreResult, effectiveEndDate: string): OpportunitySignal[] {
  const signals: OpportunitySignal[] = [];

  if (result.leagueExposure.totalExposure <= 0) {
    signals.push({ key: 'no-exposure', kind: 'warning', text: 'OUTSIDE LEAGUE WINDOW — geen league-maanden geraakt' });
    return signals;
  }

  const firstActive = result.leagueExposure.segments.find((s) => s.fraction > 0);
  if (firstActive && firstActive.fraction < 1) {
    signals.push({
      key: 'partial-start',
      kind: 'warning',
      text: `PARTIAL START MONTH — ${firstActive.label} exposure ${(firstActive.fraction * 100).toFixed(0)}%`,
    });
  }

  if (isValidIsoDate(effectiveEndDate) && compareIsoDates(effectiveEndDate, LEAGUE_PERIOD.end) < 0) {
    signals.push({ key: 'early-end', kind: 'warning', text: 'EARLY END DATE — check verlengkans' });
  }

  if (signals.length === 0) {
    signals.push({ key: 'league-eligible', kind: 'ok', text: 'LEAGUE ELIGIBLE — volledige exposure' });
  }

  return signals;
}
