import type { AppView } from '../types/navigation';

/**
 * GitHub Pages serves this app as a static SPA with no server-side rewrite
 * rules, so a path like /Wintertrip/mission-updates 404s at the CDN before
 * our own code ever runs (see App.tsx's routing comment). public/404.html
 * catches that 404, encodes the intended sub-path into a "redirect" query
 * param, and redirects to the app's own index.html — this reads that param
 * back so a bookmarked or shared /mission-updates link still lands on the
 * right view, then cleans the URL back to the base path.
 */
const DEEP_LINK_VIEWS: Record<string, AppView> = {
  'mission-updates': 'mission-updates',
  'mission-hunt': 'mission-hunt',
};

export function readDeepLinkView(search: string = window.location.search): AppView | null {
  try {
    const params = new URLSearchParams(search);
    const redirect = params.get('redirect');
    if (!redirect) return null;
    const firstSegment = redirect.replace(/^\/+/, '').split(/[/?#]/)[0];
    return DEEP_LINK_VIEWS[firstSegment] ?? null;
  } catch {
    return null;
  }
}

/** Removes the "redirect" query param from the visible URL without adding
 * a history entry — the deep link has already been consumed. */
export function clearDeepLinkParam(base: string = import.meta.env.BASE_URL) {
  try {
    window.history.replaceState({}, '', base);
  } catch {
    // history API unavailable — never fatal, the query param is just cosmetic.
  }
}
