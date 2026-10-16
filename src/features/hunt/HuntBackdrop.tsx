import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const BASE = import.meta.env.BASE_URL;
const VIDEO_WEBM = `${BASE}cinematic/hunt-room-loop.webm`;
const VIDEO_MP4 = `${BASE}cinematic/hunt-room-loop.mp4`;
const POSTER = `${BASE}cinematic/hunt-room-poster.webp`;
const MOBILE_QUERY = '(max-width: 720px)';

/** One check per page session: does the cinematic loop exist yet? Until it
 * does (public/cinematic/ is only reserved), Hunt Mode never renders a
 * <video> — no broken element, no repeated 404s, just the SVG/CSS scene. */
let cinematicCheck: Promise<boolean> | null = null;

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok && (res.headers.get('content-type') ?? '').startsWith('video/');
  } catch {
    return false;
  }
}

function cinematicAvailable(): Promise<boolean> {
  if (typeof fetch !== 'function') return Promise.resolve(false);
  cinematicCheck ??= headOk(VIDEO_WEBM).then((ok) => ok || headOk(VIDEO_MP4));
  return cinematicCheck;
}

function isMobile(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * The Hunt Mode scene behind the hero (supplied HuntBackdrop direction):
 * the future cinematic loop when it exists — desktop only, never with
 * reduced motion — over the approved SVG/CSS fallback: radar orbit, target
 * lock, hero network, horizon and a vignette. Static; no text or figures in
 * any background layer.
 */
export function HuntBackdrop() {
  const reduced = usePrefersReducedMotion();
  const [video, setVideo] = useState(false);

  useEffect(() => {
    if (reduced || isMobile()) return;
    let cancelled = false;
    void cinematicAvailable().then((ok) => {
      if (!cancelled) setVideo(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [reduced]);

  return (
    <div className="hunt3-backdrop" aria-hidden data-testid="hunt-backdrop">
      <div className="hunt3-video-fallback" />
      {video && (
        <video className="hunt3-video" autoPlay muted loop playsInline poster={POSTER} preload="metadata" onError={() => setVideo(false)}>
          <source src={VIDEO_WEBM} type="video/webm" />
          <source src={VIDEO_MP4} type="video/mp4" onError={() => setVideo(false)} />
        </video>
      )}
      <img src={`${BASE}hunt-assets/hunt-radar-orbit.svg`} alt="" className="hunt3-radar" />
      <img src={`${BASE}hunt-assets/hunt-target-lock.svg`} alt="" className="hunt3-target-art" />
      <img src={`${BASE}hunt-assets/hunt-hero-network.svg`} alt="" className="hunt3-network" />
      <img src={`${BASE}hunt-assets/hunt-horizon.svg`} alt="" className="hunt3-horizon" />
      <div className="hunt3-vignette" />
    </div>
  );
}
