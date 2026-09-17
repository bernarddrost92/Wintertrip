/** Device-scoped "who is this" selection — the WIE BEN JIJ? picker's own
 * memory, not authentication. Storing just the profiles.id (not the full
 * row) keeps display_name/role always fresh from the database on the next
 * roster fetch, never a stale local copy. */
const KEY = 'wintertrip-mission-hunt-person';

export function getSelectedPersonId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setSelectedPersonId(id: string): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // localStorage unavailable (private browsing etc.) — WIE BEN JIJ?
    // simply reappears every load, a safe fallback rather than a crash.
  }
}

export function clearSelectedPersonId(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // no-op — nothing was persisted to begin with in this case.
  }
}
