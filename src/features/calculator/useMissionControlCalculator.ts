import { useMemo, useState } from 'react';
import { DEFAULT_FACTOR, LEAGUE_PERIOD, WS_MESSAGE } from '../../config/leagueRules';
import {
  calculateExtensionScore,
  calculateHoursIncreaseEligibility,
  calculateHoursIncreaseScore,
  calculateNewPlacementScore,
  isLeagueEligibleCategory,
  validateExtensionWindow,
  validateMissionWindow,
  validateVcdb,
} from '../../services/scoring';
import type { DealCategory, MissionType, ScoreResult } from '../../types/scoring';
import { compareIsoDates, isValidIsoDate } from '../../utils/dates';

export interface CalculatorForm {
  missionType: MissionType;
  dealCategory: DealCategory;
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
  dealCategory: 'DETACHERING',
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

export interface NotEligible {
  reason: 'HOURS' | 'WS';
  message: string;
}

export interface CalculatorOutput {
  result: ScoreResult | null;
  completion: CompletionItem[];
  completeCount: number;
  totalCount: number;
  isInputComplete: boolean;
  errorMessage: string | null;
  notEligible: NotEligible | null;
  opportunities: OpportunitySignal[];
  readiness: MissionReadiness;
}

export function useMissionControlCalculator() {
  const [form, setForm] = useState<CalculatorForm>(INITIAL_FORM);

  function update<K extends keyof CalculatorForm>(key: K, value: CalculatorForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setMissionType(type: MissionType) {
    setForm((prev) => ({ ...INITIAL_FORM, missionType: type, factor: prev.factor, dealCategory: prev.dealCategory }));
  }

  function reset() {
    setForm(INITIAL_FORM);
  }

  const output: CalculatorOutput = useMemo(() => computeOutput(form), [form]);

  return { form, update, setMissionType, reset, output };
}

function computeOutput(form: CalculatorForm): CalculatorOutput {
  const wsIneligible = !isLeagueEligibleCategory(form.dealCategory);

  if (form.missionType === 'NEW_PLACEMENT') {
    const datesOk = isValidIsoDate(form.startDate) && isValidIsoDate(form.endDate) && compareIsoDates(form.endDate, form.startDate) >= 0;
    const vcdbOk = validateVcdb(toNumber(form.vcdbPerMonth)).valid;
    const completion: CompletionItem[] = [
      { key: 'type', label: 'Mission type', done: true },
      { key: 'dates', label: 'Dates valid', done: datesOk },
      { key: 'vcdb', label: 'VCDB entered', done: vcdbOk },
      { key: 'factor', label: 'Factor selected', done: true },
    ];
    const isInputComplete = completion.every((c) => c.done);
    const windowCheck = validateMissionWindow(form.startDate, form.endDate);

    if (!isInputComplete) {
      return baseOutput(completion, null, windowCheck.valid ? null : windowCheck.message ?? null, null, [], 'INPUT_REQUIRED');
    }

    if (wsIneligible) {
      return baseOutput(completion, null, null, { reason: 'WS', message: WS_MESSAGE }, [wsSignal()], 'NOT_ELIGIBLE');
    }

    const result = calculateNewPlacementScore(form.startDate, form.endDate, toNumber(form.vcdbPerMonth), form.factor, form.dealCategory);
    const opportunities = buildOpportunitySignals(result, form.endDate);
    return baseOutput(completion, result, null, null, opportunities, 'READY');
  }

  if (form.missionType === 'EXTENSION') {
    const datesOk = validateExtensionWindow(form.oldEndDate, form.newEndDate).valid && isValidIsoDate(form.awardDate);
    const vcdbOk = validateVcdb(toNumber(form.extensionVcdbPerMonth)).valid;
    const completion: CompletionItem[] = [
      { key: 'type', label: 'Mission type', done: true },
      { key: 'dates', label: 'Dates valid', done: datesOk },
      { key: 'vcdb', label: 'VCDB entered', done: vcdbOk },
      { key: 'factor', label: 'Factor selected', done: true },
    ];
    const isInputComplete = completion.every((c) => c.done);
    const windowCheck = validateExtensionWindow(form.oldEndDate, form.newEndDate);

    if (!isInputComplete) {
      return baseOutput(completion, null, windowCheck.valid ? null : windowCheck.message ?? null, null, [], 'INPUT_REQUIRED');
    }

    if (wsIneligible) {
      return baseOutput(completion, null, null, { reason: 'WS', message: WS_MESSAGE }, [wsSignal()], 'NOT_ELIGIBLE');
    }

    const result = calculateExtensionScore(
      form.oldEndDate,
      form.newEndDate,
      toNumber(form.extensionVcdbPerMonth),
      form.factor,
      form.awardDate,
      form.dealCategory,
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
    { key: 'dates', label: 'Dates valid', done: datesOk },
    { key: 'hours', label: 'Hours', done: hoursOk },
    { key: 'vcdb', label: 'VCDB entered', done: vcdbOk },
    { key: 'factor', label: 'Factor selected', done: true },
  ];
  const isInputComplete = completion.every((c) => c.done);

  if (!isInputComplete) {
    return baseOutput(completion, null, null, null, [], 'INPUT_REQUIRED');
  }

  if (wsIneligible) {
    return baseOutput(completion, null, null, { reason: 'WS', message: WS_MESSAGE }, [wsSignal()], 'NOT_ELIGIBLE');
  }

  const eligibility = calculateHoursIncreaseEligibility(toNumber(form.oldHours), toNumber(form.newHours));
  if (!eligibility.eligible) {
    const notEligible: NotEligible = {
      reason: 'HOURS',
      message: `Urenstijging van ${eligibility.increaseHours} u/w haalt de minimale 4 u/w niet.`,
    };
    return baseOutput(
      completion,
      null,
      null,
      notEligible,
      [{ key: 'not-enough-hours', kind: 'warning', text: `NOT ENOUGH HOURS INCREASE — +${eligibility.increaseHours} u/w` }],
      'NOT_ELIGIBLE',
    );
  }

  const result = calculateHoursIncreaseScore(
    toNumber(form.oldHours),
    toNumber(form.newHours),
    form.increaseStartDate,
    form.increaseEndDate,
    toNumber(form.extraVcdbPerMonth),
    form.factor,
    form.dealCategory,
  );
  const opportunities = buildOpportunitySignals(result, form.increaseEndDate);
  return baseOutput(completion, result, null, null, opportunities, 'READY');
}

function wsSignal(): OpportunitySignal {
  return { key: 'ws-not-eligible', kind: 'warning', text: `${WS_MESSAGE}` };
}

function baseOutput(
  completion: CompletionItem[],
  result: ScoreResult | null,
  errorMessage: string | null,
  notEligible: NotEligible | null,
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
    notEligible,
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
