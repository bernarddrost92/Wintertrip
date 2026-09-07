/** Sales / team one-liners, scattered subtly through the interface — never all at once. */
export const ONE_LINERS = [
  'WE GAAN VOOR GOUD.',
  'WE CAME TO WIN.',
  'MISSIE: #1.',
  'ELKE DEAL TELT.',
  'GEEN PUNTEN LATEN LIGGEN.',
  'SAMEN SCHERP. SAMEN #1.',
  'VERLENG EERDER. SCORE HARDER.',
  '2 PAAR OGEN. 0 GEMISTE KANSEN.',
  'FOCUS. EXECUTIE. RESULTAAT.',
  'IEDERE WEEK BETER.',
  'WE MAKEN DE SCORE ZICHTBAAR.',
  'MANIFESTEREN. SLUITEN. DOMINEREN.',
  'ZWOLLE PAKT GOUD.',
  'PLAY TO WIN.',
] as const;

export function pickOneLiner(seed: number): string {
  const index = Math.abs(seed) % ONE_LINERS.length;
  return ONE_LINERS[index];
}
