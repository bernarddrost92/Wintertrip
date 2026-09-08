/** Device-scoped "has this browser already been authorized" flag — unlike
 * the session-scoped intro flag, this persists in localStorage so the
 * access code only ever needs to be entered once per device/browser. */
const KEY = 'wintertrip-access-granted';

export function hasAccess(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

export function grantAccess(): void {
  try {
    localStorage.setItem(KEY, 'true');
  } catch {
    // localStorage unavailable (private browsing etc.) — the gate simply
    // reappears every load, which is a safe fallback rather than a crash.
  }
}

export function resetAccess(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // no-op — nothing was persisted to begin with in this case.
  }
}
