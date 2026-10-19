/** FTE Bon demo: the steps, their example values and how each is filled in. */
import type { DemoStep } from '../../components/DemoCoach';
import { OWN_TEAM, type PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';
import type { FteBonType } from '../../services/fteBonnen';
import { nextNetFteTarget, projectStandings } from '../../services/netFteProjection';
import { formatSignedFte } from '../../utils/format';

export interface FteBonDemoContext {
  type: FteBonType;
  fteRaw: string;
  label: string;
  owner: string;
  /** The projection on the right is showing. */
  hasEffect: boolean;
  setType: (type: FteBonType) => void;
  setFteRaw: (value: string) => void;
  setLabel: (value: string) => void;
  setOwner: (value: string) => void;
}

/** Example: one PO professional (32 uur) moved onto a contract. */
export const FTE_BON_DEMO_EXAMPLE = { type: 'PO_NAAR_CONTRACT' as FteBonType, fte: '0,8', label: 'Demo · voorbeeld', owner: 'TM' };

export function fteBonDemoSteps(standings: PowerBiStandingRow[], openFte: number): DemoStep<FteBonDemoContext>[] {
  const target = nextNetFteTarget(projectStandings(standings, OWN_TEAM, openFte));
  const targetLine = target
    ? `Voor de volgende plek (#${target.rank} ${target.team}) is ${formatSignedFte(target.fteNeeded)} FTE nodig.`
    : 'We staan #1 in Net FTE: elke bon helpt die plek vast te houden.';
  return [
    {
      key: 'type',
      title: 'Type actie',
      text: 'Wat heb je gedaan? In deze demo: een PO-professional omgezet naar contract. Alleen BPT en VD tellen mee in Net FTE.',
      selector: '[role="radiogroup"][aria-label="Type actie"]',
      fill: ({ setType }) => setType(FTE_BON_DEMO_EXAMPLE.type),
      done: ({ type }) => type === FTE_BON_DEMO_EXAMPLE.type,
    },
    {
      key: 'fte',
      title: 'Groei in FTE',
      text: 'Hoeveel FTE komt erbij? 32 uur per week is 0,8 FTE, 40 uur is 1,0. De knoppen eronder zijn snelkeuzes.',
      selector: '#fte-bon-fte',
      fill: ({ setFteRaw }) => setFteRaw(FTE_BON_DEMO_EXAMPLE.fte),
      done: ({ fteRaw }) => fteRaw.trim() !== '',
    },
    {
      key: 'effect',
      title: 'Het effect',
      text: `Hier zie je direct wat deze bon doet met onze Net FTE, FTE-rank, factor en positie. ${targetLine}`,
      selector: '[data-demo="fte-effect"]',
      done: ({ hasEffect }) => hasEffect,
    },
    {
      key: 'label',
      title: 'Naam / label',
      text: 'Initialen van de professional of een korte omschrijving, zodat het team weet over welke move het gaat.',
      selector: '#fte-bon-label',
      fill: ({ setLabel }) => setLabel(FTE_BON_DEMO_EXAMPLE.label),
      done: ({ label }) => label.trim() !== '',
    },
    {
      key: 'owner',
      title: 'Talent Manager',
      text: 'Wie heeft deze move gemaakt? Vul de initialen van de Talent Manager in.',
      selector: '#fte-bon-owner',
      fill: ({ setOwner }) => setOwner(FTE_BON_DEMO_EXAMPLE.owner),
      done: ({ owner }) => owner.trim() !== '',
    },
    {
      key: 'save',
      title: 'Pak FTE-bon',
      text: 'In het echt klik je nu op Pak FTE-bon: de bon komt bij de open bonnen en telt mee in de projectie. In de demo slaan we niets op.',
      selector: '[data-demo="fte-save"]',
      done: () => true,
    },
  ];
}
