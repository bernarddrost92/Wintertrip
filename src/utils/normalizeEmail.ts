/** The one shared definition of "same person" by email — mirrors the
 * database's public.normalize_email() exactly (trim + lowercase), so a
 * client-side fingerprint or ownership comparison never disagrees with what
 * RLS actually enforces. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
