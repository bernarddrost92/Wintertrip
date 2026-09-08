/**
 * The three states "Winst door Dubbelcheck" (nee "Punten Gevonden") can be
 * in on a receipt — shared between the on-screen/PNG card and the WhatsApp
 * text so both always agree. The underlying number, when there is one, is
 * still exactly calculateFoundPoints()'s Base Score delta × Factor
 * (services/missionReceipt.ts, untouched) — this only decides how to talk
 * about it when there is nothing real to show, so a "no change" result and
 * "we never had the data" never both collapse into a misleading "+0,00".
 */
export type DubbelcheckState =
  | { kind: 'found'; points: number }
  | { kind: 'none-recorded' }
  | { kind: 'not-calculated' };

export function getDubbelcheckState(foundLeaguePoints: number | null): DubbelcheckState {
  if (foundLeaguePoints === null) return { kind: 'not-calculated' };
  const rounded = Math.round(foundLeaguePoints * 100) / 100;
  if (rounded === 0) return { kind: 'none-recorded' };
  return { kind: 'found', points: foundLeaguePoints };
}
