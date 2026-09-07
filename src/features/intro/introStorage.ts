/** Session-scoped "has the mission gate already been cleared" flag — the
 * intro plays once per browser session, not once per navigation. */
const KEY = 'ws27-intro-seen';

export function hasSeenIntro(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // sessionStorage unavailable (private browsing etc.) — the gate simply
    // replays every load, which is a safe fallback rather than a crash.
  }
}
