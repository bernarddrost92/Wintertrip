/*
 * The cinematic asset contract for Hunt Mode — see public/cinematic/README.txt,
 * the one place it is documented. Priority: webm → mp4 → poster → SVG/CSS
 * fallback. No other file names.
 */
const BASE = import.meta.env.BASE_URL;

export const CINEMATIC = {
  webm: `${BASE}cinematic/hunt-room-loop.webm`,
  mp4: `${BASE}cinematic/hunt-room-loop.mp4`,
  poster: `${BASE}cinematic/hunt-room-poster.webp`,
} as const;

/** No looping background video at or below this width — mobile stays fast. */
const MOBILE_QUERY = '(max-width: 720px)';

/** Session-wide availability checks — at most one HEAD request per file per
 * page load, so a missing asset never causes repeated 404s, broken elements
 * or retries while people use Hunt Mode. */
let videoCheck: Promise<boolean> | null = null;
let posterCheck: Promise<boolean> | null = null;

async function headOk(url: string, type: 'video/' | 'image/'): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok && (res.headers.get('content-type') ?? '').startsWith(type);
  } catch {
    return false;
  }
}

export function videoAvailable(): Promise<boolean> {
  if (typeof fetch !== 'function') return Promise.resolve(false);
  videoCheck ??= headOk(CINEMATIC.webm, 'video/').then((ok) => ok || headOk(CINEMATIC.mp4, 'video/'));
  return videoCheck;
}

export function posterAvailable(): Promise<boolean> {
  if (typeof fetch !== 'function') return Promise.resolve(false);
  posterCheck ??= headOk(CINEMATIC.poster, 'image/');
  return posterCheck;
}

/** Test hook: forget the cached checks. */
export function resetCinematicChecks() {
  videoCheck = null;
  posterCheck = null;
}

export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches;
}
