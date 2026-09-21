/**
 * Presentation-only privacy masking for the live 007 / Wintertrip frontend
 * — no stored data is ever changed by these helpers. A full professional
 * name is never shown anywhere in Mission Hunt after this hotfix; only
 * initials. A real client/customer name is never shown; only its city
 * (derived from the existing client_name string — "LOCATIE ONBEKEND" when
 * no city can be determined, never the real name). DB is rounded for
 * display only — the exact stored value is untouched.
 */

/** "Janny Hakkers" -> "J.H.", "Ellen 't Hoen-Kemna" -> "E.H.K.",
 * "Jeanette Nuis-De Berg" -> "J.N.D.B." — deterministic: the same name
 * always renders the same initials. Splits on spaces and hyphens, keeps
 * only parts starting with an uppercase letter (drops lowercase Dutch
 * tussenvoegsels like "'t", "van", "de" when they appear as a separate
 * word), takes each part's first letter. Never returns the full name. */
export function formatProfessionalInitials(name: string | null): string {
  if (!name) return '';
  const parts = name
    .trim()
    .split(/[\s-]+/)
    .filter((part) => part.length > 0 && /^[A-ZÀ-ÿ]/.test(part));
  if (parts.length === 0) return '';
  return parts.map((part) => `${part.charAt(0).toUpperCase()}.`).join('');
}

const FALLBACK_LOCATION = 'LOCATIE ONBEKEND';

/** Derives a displayable city — never the real client name itself.
 * Prefers the real client_city (from the original import source's "Stad
 * klant", once backfilled/imported) when present. Falls back to the
 * "Gemeente <City>" name heuristic only when no real city is stored yet.
 * Never guesses beyond that — anything else shows FALLBACK_LOCATION. */
export function formatClientLocation(clientName: string | null, clientCity: string | null = null): string {
  const realCity = clientCity?.trim();
  if (realCity) return realCity;
  if (!clientName) return FALLBACK_LOCATION;
  const match = clientName.trim().match(/^Gemeente\s+(.+)$/i);
  const city = match?.[1]?.trim();
  return city || FALLBACK_LOCATION;
}

/** Rounds a DB value for display only — the exact stored value in
 * Supabase is never touched. 14.59 -> "15", 6.02 -> "6", 43.08 -> "43". */
export function formatDisplayDb(db: number | null): string {
  if (db === null) return '—';
  return String(Math.round(db));
}
