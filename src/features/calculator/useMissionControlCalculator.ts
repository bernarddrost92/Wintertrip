import { useMemo, useState } from 'react';
import { DEFAULT_FACTOR, LEAGUE_PERIOD, WS_MESSAGE } from '../../config/leagueRules';
import {
  calculateHoursIncreaseEligibility,
  evaluateExtensionTiming,
  isLeagueEligibleCategory,
  validateExtensionWindow,
  validateMissionWindow,
  validateVcdb,
} from '../../services/scoring';
import type { DealCategory, ExtensionTiming, MissionType, ScoreResult } from '../../types/scoring';
import { compareIsoDates, formatIsoDateNl, isValidIsoDate } from '../../utils/dates';
import { computeResultForForm } from './computeResult';

export interface CalculatorForm {
  missionType: MissionType;
  dealCategory: DealCategory;
  factor: number;
  // NEW_PLACEMENT
  startDate: string;
  endDate: string;
  vcdbPerMonth: string;
  // EXTENSION
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
  oldEndDate: '',
  newEndDate: '',
  extensionVcdbPerMonth: '',
  increaseStartDate: '',
  increaseEndDate: '',
  oldHours: '',
  newHours: '',
  extraVcdbPerMonth: '',
};

export function toNumber(raw: string): number {
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
  reason: 'HOURS' | 'WS' | 'TOO_LATE';
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
  /** EXTENSION only: the automatically-derived new-term-start + whether it
   * qualifies, shown as soon as a current end date is entered — independent
   * of whether the rest of the form is complete yet. */
  extensionTiming: ExtensionTiming | null;
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
      return baseOutput(completion, null, windowCheck.valid ? null : windowCheck.message ?? null, null, [], 'INPUT_REQUIRED', null);
    }

    if (wsIneligible) {
      return baseOutput(completion, null, null, { reason: 'WS', message: WS_MESSAGE }, [wsSignal()], 'NOT_ELIGIBLE', null);
    }

    const result = computeResultForForm(form);
    const opportunities = buildOpportunitySignals(result);
    return baseOutput(completion, result, null, null, opportunities, 'READY', null);
  }

  if (form.missionType === 'EXTENSION') {
    const datesOk = validateExtensionWindow(form.oldEndDate, form.newEndDate).valid;
    const vcdbOk = validateVcdb(toNumber(form.extensionVcdbPerMonth)).valid;
    const completion: CompletionItem[] = [
      { key: 'type', label: 'Mission type', done: true },
      { key: 'dates', label: 'Dates valid', done: datesOk },
      { key: 'vcdb', label: 'VCDB entered', done: vcdbOk },
      { key: 'factor', label: 'Factor selected', done: true },
    ];
    const isInputComplete = completion.every((c) => c.done);
    const windowCheck = validateExtensionWindow(form.oldEndDate, form.newEndDate);
    const extensionTiming = isValidIsoDate(form.oldEndDate) ? evaluateExtensionTiming(form.oldEndDate) : null;

    if (!isInputComplete) {
      return baseOutput(completion, null, windowCheck.valid ? null : windowCheck.message ?? null, null, [], 'INPUT_REQUIRED', extensionTiming);
    }

    if (wsIneligible) {
      return baseOutput(completion, null, null, { reason: 'WS', message: WS_MESSAGE }, [wsSignal()], 'NOT_ELIGIBLE', extensionTiming);
    }

    if (extensionTiming && !extensionTiming.qualifies) {
      const notEligible = {
        reason: 'TOO_LATE' as const,
        message: `Nieuwe termijn start ${formatIsoDateNl(extensionTiming.newTermStart)} — na 31 januari ${LEAGUE_PERIOD.end.slice(0, 4)}. Verlenging telt niet mee.`,
      };
      return baseOutput(completion, null, null, notEligible, [tooLateSignal(extensionTiming)], 'NOT_ELIGIBLE', extensionTiming);
    }

    const result = computeResultForForm(form);
    const opportunities = buildOpportunitySignals(result);
    return baseOutput(completion, result, null, null, opportunities, 'READY', extensionTiming);
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
    return baseOutput(completion, null, null, null, [], 'INPUT_REQUIRED', null);
  }

  if (wsIneligible) {
    return baseOutput(completion, null, null, { reason: 'WS', message: WS_MESSAGE }, [wsSignal()], 'NOT_ELIGIBLE', null);
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
      null,
    );
  }

  const result = computeResultForForm(form);
  const opportunities = buildOpportunitySignals(result);
  return baseOutput(completion, result, null, null, opportunities, 'READY', null);
}

function wsSignal(): OpportunitySignal {
  return { key: 'ws-not-eligible', kind: 'warning', text: `${WS_MESSAGE}` };
}

function tooLateSignal(timing: ExtensionTiming): OpportunitySignal {
  return {
    key: 'extension-too-late',
    kind: 'warning',
    text: `TOO LATE — nieuwe termijn start ${formatIsoDateNl(timing.newTermStart)}, na de meetdatum`,
  };
}

function baseOutput(
  completion: CompletionItem[],
  result: ScoreResult | null,
  errorMessage: string | null,
  notEligible: NotEligible | null,
  opportunities: OpportunitySignal[],
  readinessIfComplete: MissionReadiness,
  extensionTiming: ExtensionTiming | null,
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
    extensionTiming,
  };
}

/**
 * Signals derived strictly from the computed result — never invented. Each
 * one reads directly off the qualifying-term breakdown.
 */
function buildOpportunitySignals(result: ScoreResult): OpportunitySignal[] {
  const signals: OpportunitySignal[] = [];

  if (result.qualifyingTerm.segments.length === 0 || result.baseScore <= 0) {
    signals.push({ key: 'no-value', kind: 'warning', text: 'NO QUALIFYING TERM — controleer de data' });
    return signals;
  }

  const first = result.qualifyingTerm.segments[0];
  if (first.fraction < 1) {
    signals.push({
      key: 'partial-start',
      kind: 'warning',
      text: `PARTIAL START MONTH — ${first.label} ${first.overlapDays}/${first.daysInMonth} dagen`,
    });
  }

  const last = result.qualifyingTerm.segments[result.qualifyingTerm.segments.length - 1];
  if (last.fraction < 1 && last.monthKey !== first.monthKey) {
    signals.push({
      key: 'partial-end',
      kind: 'warning',
      text: `PARTIAL END MONTH — ${last.label} ${last.overlapDays}/${last.daysInMonth} dagen`,
    });
  }

  if (signals.length === 0) {
    signals.push({ key: 'full-term', kind: 'ok', text: 'VOLLEDIGE KALENDERMAANDEN — geen punten laten liggen' });
  }

  return signals;
}
