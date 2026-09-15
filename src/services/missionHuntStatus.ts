import type { OpportunityType, ProjectStatus } from '../types/missionHunt';

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  unreviewed: 'NOG BEOORDELEN',
  opportunity: 'KANS',
  investigate: 'UITZOEKEN',
  no_action: 'GEEN ACTIE',
};

export const STATUS_ICON: Record<ProjectStatus, string> = {
  unreviewed: '○',
  opportunity: '🟢',
  investigate: '🟡',
  no_action: '⚫',
};

/** Display order used everywhere a full status list renders (the status
 * picker, filters) — matches the order given in the spec. */
export const STATUS_ORDER: ProjectStatus[] = ['opportunity', 'investigate', 'no_action', 'unreviewed'];

export const OPPORTUNITY_TYPE_LABEL: Record<OpportunityType, string> = {
  earlier_start: 'Eerder starten',
  extend: 'Langer plaatsen / verlengen',
  plus_four_hours: '+4 uur of meer',
  more_vcdb: 'Meer VCDB',
  keep_fte: 'FTE behouden',
  add_fte: 'FTE toevoegen',
  other: 'Anders',
};

export const OPPORTUNITY_TYPE_ORDER: OpportunityType[] = [
  'earlier_start',
  'extend',
  'plus_four_hours',
  'more_vcdb',
  'keep_fte',
  'add_fte',
  'other',
];

/** Opportunity types are only ever meaningful for a project someone flagged
 * as worth pursuing — offering them for GEEN ACTIE / NOG BEOORDELEN would
 * just be noise on a status that doesn't warrant a "why" yet. */
export function statusSupportsOpportunityTypes(status: ProjectStatus): boolean {
  return status === 'opportunity' || status === 'investigate';
}

/** Status colors used sparingly (spec section 28) — green/amber/grey/outline
 * only on the status pill itself, never as a general dashboard palette. */
export function statusToneClasses(status: ProjectStatus): string {
  switch (status) {
    case 'opportunity':
      return 'border-status-go/50 bg-status-go/10 text-status-go';
    case 'investigate':
      return 'border-gold/50 bg-gold/10 text-gold';
    case 'no_action':
      return 'border-white/15 bg-white/5 text-ink-muted';
    case 'unreviewed':
      return 'border-white/20 bg-transparent text-ink-muted';
  }
}
