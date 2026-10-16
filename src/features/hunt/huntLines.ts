import { formatSignedFte } from '../../utils/format';
import type { HuntIntel } from './huntIntel';

/**
 * Hunt Mode copy — local, client-side, no API. The one-liners motivate, the
 * missions are short, concrete sales actions toward contract-FTE.
 */
export const HUNT_ONE_LINERS = [
  'DE PUNTEN ZIJN BINNEN. NU VERZILVEREN.',
  'LOCK DE FTE. LOCK DE WINST.',
  'IEDERE +0,1 FTE TELT.',
  'VCDB #1. NU MOET DE FACTOR MEE.',
  'DE VOORSPRONG IS ER. MAAK HEM WAARD.',
  'GEEN PRAATJES. BONNETJES.',
  'PAK FTE. PAK JE BON. PAK DE VOLGENDE PLEK.',
  'DE FACTOR IS GEEN CADEAU. PAK HEM.',
  'EEN VERLENGING IS OOK EEN AANVAL.',
  'HOUD WAT JE HEBT. BOUW WAT JE MIST.',
  'WE HEBBEN DE PUNTEN. NU DE VERMENIGVULDIGER.',
  'DE JACHT STOPT PAS OP 31 JANUARI.',
  'ÉÉN MOVE KAN DE RANKING VERANDEREN.',
  'KIJK NIET NAAR #1 VCDB. KIJK NAAR WAT ER NOG TE HALEN VALT.',
  'CONTRACT-FTE. DAAR LIGT DE WINST.',
  'TEAM ZWOLLE. NU DOORPAKKEN.',
  'PO IS EEN KANS. CONTRACT IS DE SCORE.',
  'ELKE VERLENGING IS EEN PLEK OMHOOG.',
  'UREN OMHOOG. FACTOR OMHOOG.',
  'WIE NU BELT, SCOORT IN JANUARI.',
  'NIET WACHTEN. VASTLEGGEN.',
  'DE VOLGENDE PLEK LIGT BINNEN BEREIK.',
  'BPT + VD. DAT IS DE OPDRACHT.',
  'KLEIN IN FTE. GROOT IN FACTOR.',
  'DE TARGET STAAT. NU DE TREKKER.',
  'VANDAAG DE MOVE. MORGEN DE RANKING.',
  'SAMEN SCHERP. SAMEN #1.',
  'MISSIE GESLAAGD BEGINT MET ÉÉN BON.',
] as const;

export const HUNT_MISSIONS = [
  'Vind vandaag één BPT/VD’er die je kunt verlengen.',
  'Welke PO-professional kun jij omzetten naar contract?',
  'Welke contractant kan structureel meer uren werken?',
  'Welke kandidaat kunnen we deze week als nieuwe contractant binnenhalen?',
  'Pak één verlenging vóór het einde van vandaag.',
  'Bel drie professionals met als doel contract-FTE vast te houden.',
  'Zoek in je portefeuille naar één concrete +0,1 FTE.',
  'Check welke contracten vóór 31 januari aflopen en plan het verlenggesprek.',
  'Vraag één klant welke PO-professional zij liever vast op contract hebben.',
  'Zet één PO-professional deze week op de lijst voor omzetting naar contract.',
  'Bespreek met je Talent Manager één professional die meer uren wil.',
  'Plan vandaag één gesprek over een langere contractduur.',
  'Vind één parttime contractant die een dag extra kan werken.',
  'Bel één klant over een openstaande vacature voor een nieuwe contractant.',
  'Maak van één twijfelende verlenging vandaag een ja.',
  'Zoek één professional bij wie het contract binnenkort afloopt — en bel.',
  'Leg één gemaakte move vandaag vast als FTE-bon.',
  'Vraag je team: wie heeft deze week nog +0,2 FTE in de pijplijn?',
] as const;

/** A random item from `items`, never `current` when there is a choice — so
 * every click visibly changes. `random` is injectable for tests. */
export function pickDifferent<T>(items: readonly T[], current: T | null, random: () => number = Math.random): T {
  if (items.length === 1) return items[0];
  const pool = current === null ? items : items.filter((item) => item !== current);
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

/** WAR ROOM one-liners — short, punchy, flown at the viewer. The live
 * "TARGET ACQUIRED" line is added from the standings at runtime. */
export const WAR_ROOM_LINES = [
  'VCDB #1 IS MOOI. NU VERZILVEREN.',
  'MEER CONTRACTANTEN. MEER FACTOR.',
  'ELKE FTE TELT.',
  'PAK JE BON.',
  'VERLENG. ZET VAST. HOOG OP.',
  'GEEN PRAATJES. BONNETJES.',
  'DE FACTOR IS GEEN CADEAU.',
  'BPT + VD. DAAR TELT HET.',
  'PO → CONTRACT. NU.',
  'ÉÉN MOVE. ÉÉN PLEK.',
  'DE JACHT STOPT OP 31 JANUARI.',
  'TEAM ZWOLLE. DOORPAKKEN.',
] as const;

/** The lines for this War Room: the live target lines first, then the fixed set. */
export function warRoomLines(intel: HuntIntel): string[] {
  const target = intel.nextTarget;
  const live = target
    ? [`TARGET ACQUIRED: ${target.team.toUpperCase()}`, `${formatSignedFte(target.fteNeeded)} FTE. DAN IS ${target.team.toUpperCase()} VAN ONS.`]
    : ['#1 IN NET FTE. VASTHOUDEN.'];
  return [...live, ...WAR_ROOM_LINES];
}
