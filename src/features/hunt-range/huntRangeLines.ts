import type { PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';
import { netFteTargetsAbove, projectStandings, type NetFteTarget } from '../../services/netFteProjection';
import { formatSignedFte } from '../../utils/format';

/**
 * HUNT RANGE — data and copy. A fun-only mini-game: the targets are the
 * vestigingen above Zwolle in Net FTE (from the same projection Hunt Mode
 * uses: official + open bonnen), the score is never stored and changes
 * nothing. Local copy, no API.
 */

/** Targets per round. */
export const RANGE_ROUND_SIZE = 5;

/** Every team above ownTeam in Net FTE, nearest first — the first one is
 * Hunt Mode's NEXT TARGET. Empty when Zwolle is #1. */
export function getRangeTargets(standings: PowerBiStandingRow[], ownTeam: string, openFte: number): NetFteTarget[] {
  return netFteTargetsAbove(projectStandings(standings, ownTeam, openFte));
}

export interface RangeAppearance {
  /** Unique per appearance — a team can show up twice in one round. */
  id: string;
  target: NetFteTarget;
  /** The nearest team above Zwolle. */
  next: boolean;
}

/** One round: RANGE_ROUND_SIZE appearances, nearest team first, cycling
 * through (at most) the five nearest teams when fewer are above Zwolle. */
export function buildRound(targets: NetFteTarget[]): RangeAppearance[] {
  if (targets.length === 0) return [];
  const pool = targets.slice(0, RANGE_ROUND_SIZE);
  const nextTeam = targets[0].team;
  return Array.from({ length: RANGE_ROUND_SIZE }, (_, i) => {
    const target = pool[i % pool.length];
    return { id: `${i}-${target.team}`, target, next: target.team === nextTeam };
  });
}

export interface RangeHitLine {
  title: string;
  body: string;
}

/** {team} → city name, {fte} → FTE still needed to pass it. */
export const RANGE_HIT_LINES: readonly RangeHitLine[] = [
  { title: 'TARGET HIT — {TEAM}', body: 'Mooi schot. Nu nog even dezelfde energie in je sales.' },
  { title: 'RAAK.', body: 'Helaas levert dit nog geen FTE op. Pak je telefoon.' },
  { title: 'TARGET DOWN.', body: '{team} is pas echt gepakt als de FTE binnen is.' },
  { title: 'SCHERP.', body: 'Nu een verlenging, contract of urenuitbreiding.' },
  { title: 'LEKKER GESCHOTEN.', body: 'Nu nog handel.' },
  { title: 'TARGET LOCKED.', body: '{fte} FTE nodig. Aan de bak.' },
  { title: 'MOOI.', body: 'Maar bonnetjes winnen de league.' },
  { title: 'VOLTREFFER.', body: 'Op karton. Nu nog op contract.' },
  { title: 'BULLSEYE.', body: 'De ranking merkte er niks van. Een verlenging wel.' },
  { title: 'KOELBLOEDIG.', body: 'Gebruik die rust in je volgende klantgesprek.' },
  { title: 'GERAAKT.', body: '{team} staat er morgen gewoon weer. Jij ook — met een bon?' },
  { title: 'NETJES.', body: 'Karton telt niet mee. BPT en VD wel.' },
  { title: 'DOEL GETROFFEN.', body: 'Nu nog één PO omzetten naar contract.' },
  { title: 'RAAK GESCHOTEN.', body: 'De league kijkt alleen naar FTE-bonnen.' },
  { title: 'PRECIES.', body: 'Precies zo pak je straks die verlenging.' },
  { title: 'HIT CONFIRMED.', body: '{team} voelt hier niks van. Bij {fte} FTE wel.' },
  { title: 'SCHOT IN DE ROOS.', body: 'Nu de roos bij je klant: uren omhoog.' },
  { title: 'GOED BEZIG, AGENT.', body: 'Maar Q wil bonnetjes zien.' },
];

/** A hit line with the live target filled in. */
export function fillHitLine(line: RangeHitLine, target: NetFteTarget): RangeHitLine {
  const fill = (text: string) =>
    text
      .replace('{TEAM}', target.team.toUpperCase())
      .replace('{team}', target.team)
      .replace('{fte}', formatSignedFte(target.fteNeeded));
  return { title: fill(line.title), body: fill(line.body) };
}

/** The deliberately deflating verdict above "FTE VERDIEND: 0,00". */
export function resultVerdict(hits: number, total: number): string {
  if (hits === total) return 'LEKKER.';
  if (hits >= total - 2) return 'BIJNA PERFECT.';
  if (hits > 0) return 'DAT KAN SCHERPER.';
  return 'HELEMAAL MIS. GELUKKIG TELT DIT NIET.';
}

/** What a perfect round earns in real FTE. Always. That's the joke. */
export const RANGE_FTE_EARNED = 0;
