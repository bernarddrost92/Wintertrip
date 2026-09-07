import { useMemo, useState } from 'react';
import { DEFAULT_FACTOR } from '../../config/scoringConfig';
import {
  calculateExtensionScore,
  calculateHoursIncreaseScore,
  calculateScoreBreakdown,
  isNonScoringDomain,
  validateHoursIncrease,
} from '../../services/scoring';
import type { Domain, MissionType, ScoreBreakdown } from '../../types/league';
import { isValidIsoDate } from '../../utils/dates';
import { nextIsoDay } from '../../utils/nextDay';

export interface CalculatorFormState {
  missionType: MissionType | null;
  domain: Domain | '';
  accountManager: string;
  talentManager: string;
  newContractor: boolean;
  // NEW_PLACEMENT
  startDate: string;
  endDate: string;
  vcdbPerMonth: string;
  // EXTENSION
  currentEndDate: string;
  newEndDate: string;
  extensionVcdbPerMonth: string;
  // HOURS_INCREASE
  oldHours: string;
  newHours: string;
  increaseStartDate: string;
  increaseEndDate: string;
  hoursVcdbPerMonth: string;
  factor: number;
}

export const INITIAL_CALCULATOR_STATE: CalculatorFormState = {
  missionType: null,
  domain: '',
  accountManager: '',
  talentManager: '',
  newContractor: true,
  startDate: '',
  endDate: '',
  vcdbPerMonth: '',
  currentEndDate: '',
  newEndDate: '',
  extensionVcdbPerMonth: '',
  oldHours: '',
  newHours: '',
  increaseStartDate: '',
  increaseEndDate: '',
  hoursVcdbPerMonth: '',
  factor: DEFAULT_FACTOR.value,
};

function toNumber(raw: string): number {
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export interface CalculatorResult {
  breakdown: ScoreBreakdown | null;
  wsWarning: boolean;
  hoursTooSmall: boolean;
  hoursIncreaseAmount: number;
  isComplete: boolean;
  detailsValid: boolean;
  /** The date range that actually scores (added period for extensions, increase window for hours). */
  effectiveStartDate: string | null;
  effectiveEndDate: string | null;
}

export function useMissionCalculator() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CalculatorFormState>(INITIAL_CALCULATOR_STATE);

  function update<K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setMissionType(type: MissionType) {
    setForm((prev) => ({ ...INITIAL_CALCULATOR_STATE, missionType: type, factor: prev.factor }));
  }

  function reset() {
    setForm(INITIAL_CALCULATOR_STATE);
    setStep(1);
  }

  const wsWarning = isNonScoringDomain(form.domain);

  const detailsValid = useMemo(() => {
    if (!form.missionType) return false;
    if (!form.accountManager.trim() || !form.talentManager.trim()) return false;

    if (form.missionType === 'NEW_PLACEMENT') {
      return (
        isValidIsoDate(form.startDate) &&
        isValidIsoDate(form.endDate) &&
        form.endDate > form.startDate &&
        toNumber(form.vcdbPerMonth) > 0 &&
        form.domain !== ''
      );
    }

    if (form.missionType === 'EXTENSION') {
      return (
        isValidIsoDate(form.currentEndDate) &&
        isValidIsoDate(form.newEndDate) &&
        form.newEndDate > form.currentEndDate &&
        toNumber(form.extensionVcdbPerMonth) > 0 &&
        form.domain !== ''
      );
    }

    // HOURS_INCREASE
    return (
      isValidIsoDate(form.increaseStartDate) &&
      isValidIsoDate(form.increaseEndDate) &&
      form.increaseEndDate > form.increaseStartDate &&
      toNumber(form.newHours) > toNumber(form.oldHours) &&
      toNumber(form.hoursVcdbPerMonth) > 0
    );
  }, [form]);

  const result: CalculatorResult = useMemo(() => {
    const empty: CalculatorResult = {
      breakdown: null,
      wsWarning,
      hoursTooSmall: false,
      hoursIncreaseAmount: 0,
      isComplete: false,
      detailsValid,
      effectiveStartDate: null,
      effectiveEndDate: null,
    };

    if (!form.missionType || !detailsValid) return empty;

    if (form.missionType === 'NEW_PLACEMENT') {
      const breakdown = wsWarning
        ? null
        : calculateScoreBreakdown(form.startDate, form.endDate, toNumber(form.vcdbPerMonth), form.factor);
      return {
        ...empty,
        breakdown,
        isComplete: true,
        effectiveStartDate: form.startDate,
        effectiveEndDate: form.endDate,
      };
    }

    if (form.missionType === 'EXTENSION') {
      const breakdown = wsWarning
        ? null
        : calculateExtensionScore(form.currentEndDate, form.newEndDate, toNumber(form.extensionVcdbPerMonth), form.factor);
      return {
        ...empty,
        breakdown,
        isComplete: true,
        effectiveStartDate: nextIsoDay(form.currentEndDate),
        effectiveEndDate: form.newEndDate,
      };
    }

    // HOURS_INCREASE
    const validation = validateHoursIncrease(toNumber(form.oldHours), toNumber(form.newHours));
    const scored = calculateHoursIncreaseScore(
      toNumber(form.oldHours),
      toNumber(form.newHours),
      form.increaseStartDate,
      form.increaseEndDate,
      toNumber(form.hoursVcdbPerMonth),
      form.factor,
    );
    return {
      ...empty,
      breakdown: scored.breakdown,
      wsWarning: false,
      hoursTooSmall: !validation.valid,
      hoursIncreaseAmount: validation.increaseHours,
      isComplete: true,
      effectiveStartDate: form.increaseStartDate,
      effectiveEndDate: form.increaseEndDate,
    };
  }, [form, wsWarning, detailsValid]);

  return { step, setStep, form, update, setMissionType, reset, result };
}
