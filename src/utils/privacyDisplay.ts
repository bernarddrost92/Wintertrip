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

/** Derives a displayable city from the existing client_name — never the
 * real client name itself. Only "Gemeente <City>" names have a city
 * unambiguously present in the current data; anything else falls back to
 * FALLBACK_LOCATION rather than ever guessing or leaking the real name. */
export function formatClientLocation(clientName: string | null): string {
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
