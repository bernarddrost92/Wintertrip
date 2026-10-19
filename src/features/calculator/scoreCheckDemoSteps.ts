/** Score Check demo: the steps, their example values and how each is filled in. */
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { getMissionSnapshot } from '../../services/missionSnapshot';
import type { MissionType } from '../../types/scoring';
import { formatFactor } from '../../utils/format';
import type { CalculatorForm, CalculatorOutput } from './useMissionControlCalculator';

export interface DemoContext {
  form: CalculatorForm;
  output: CalculatorOutput;
  update: <K extends keyof CalculatorForm>(key: K, value: CalculatorForm[K]) => void;
  setMissionType: (type: MissionType) => void;
}

export interface DemoStep {
  key: string;
  title: string;
  text: string;
  /** The element to light up. */
  selector: string;
  /** Fills in the example value — absent on the last, read-only step. */
  fill?: (ctx: DemoContext) => void;
  done: (ctx: DemoContext) => boolean;
}

/** Example values: a new placement that starts inside the league. */
export const DEMO_EXAMPLE = { startDate: '2026-11-02', endDate: '2027-06-30', vcdb: '10' } as const;

/** The team's current factor, straight from the official standings. */
function ownFactor(): { factor: number; rank: number } {
  const own = getMissionSnapshot().standings.find((row) => row.team === OWN_TEAM);
  return { factor: own?.factor ?? 1, rank: own?.netFteRanking ?? 0 };
}

export function demoSteps(): DemoStep[] {
  const { factor, rank } = ownFactor();
  return [
    {
      key: 'type',
      title: 'Kies de actie',
      text: 'Wat heb je gedaan? In deze demo: een nieuwe plaatsing. Verlenging en uren ophogen werken op dezelfde manier.',
      selector: '[role="radiogroup"][aria-label="Kies actie"]',
      fill: ({ setMissionType }) => setMissionType('NEW_PLACEMENT'),
      done: ({ form }) => form.missionType === 'NEW_PLACEMENT',
    },
    {
      key: 'deal',
      title: 'Soort deal',
      text: 'Detachering telt mee voor de league. W&S telt niet mee.',
      selector: '[role="radiogroup"][aria-label="Soort deal"]',
      fill: ({ update }) => update('dealCategory', 'DETACHERING'),
      done: ({ form }) => form.dealCategory === 'DETACHERING',
    },
    {
      key: 'start',
      title: 'Startdatum',
      text: 'Wanneer begint de professional? Een nieuwe plaatsing telt mee als hij start tussen 1 september 2026 en 31 januari 2027.',
      selector: '#startDate',
      fill: ({ update }) => update('startDate', DEMO_EXAMPLE.startDate),
      done: ({ form }) => form.startDate !== '',
    },
    {
      key: 'end',
      title: 'Einddatum',
      text: 'Tot wanneer loopt de opdracht? Vul de echte einddatum in; de app telt zelf alleen de maanden tot en met januari.',
      selector: '#endDate',
      fill: ({ update }) => update('endDate', DEMO_EXAMPLE.endDate),
      done: ({ form }) => form.endDate !== '',
    },
    {
      key: 'vcdb',
      title: 'VCDB per maand',
      text: 'De VCDB van deze plaatsing voor een volledige maand. Halve maanden rekent de app zelf naar rato.',
      selector: '#vcdb',
      fill: ({ update }) => update('vcdbPerMonth', DEMO_EXAMPLE.vcdb),
      done: ({ form }) => form.vcdbPerMonth !== '',
    },
    {
      key: 'factor',
      title: 'Factor',
      text: `Kies de factor van onze Net FTE-positie: nu ${formatFactor(factor)} (#${rank}). Dan zie je wat de deal echt oplevert.`,
      selector: '[role="radiogroup"][aria-label="Factor"]',
      fill: ({ update }) => update('factor', factor),
      done: ({ form }) => form.factor === factor,
    },
    {
      key: 'result',
      title: 'Je score',
      text: 'Dit levert de plaatsing op in league-punten. Met "Door naar League Check" laat je daarna een collega meekijken.',
      selector: '[data-demo="result"]',
      done: ({ output }) => output.result !== null,
    },
  ];
}
