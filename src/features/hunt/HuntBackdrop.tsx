import { memo, useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { CINEMATIC, isMobileViewport, posterAvailable, videoAvailable } from './cinematicAssets';

const BASE = import.meta.env.BASE_URL;

interface HuntBackdropProps {
  /** Fresh from the switch: fade the whole room in at 1.45s of the activation. */
  entering: boolean;
}

/**
 * The room every Hunt Mode layer plays in. Layers, bottom to top:
 * SVG/CSS fallback (always there) → poster (if it exists) → cinematic loop
 * (desktop only, never with reduced motion, never on ≤720px) → dark shade
 * for legibility → supplied radar / target / network / horizon art →
 * vignette. Poster and video start at opacity 0 and fade in only once they
 * have actually loaded, so nothing ever pops, flashes black or shifts; if
 * either fails, the layer below simply stays.
 *
 * Memoised and props-stable: mission/motivation reveals, the War Room and
 * any other Hunt Mode state never re-render or restart it — the loop plays
 * on as the space the UI lives in.
 */
export const HuntBackdrop = memo(function HuntBackdrop({ entering }: HuntBackdropProps) {
  const reduced = usePrefersReducedMotion();
  const [poster, setPoster] = useState<'none' | 'loading' | 'ready'>('none');
  const [video, setVideo] = useState<'none' | 'loading' | 'ready'>('none');

  useEffect(() => {
    let cancelled = false;
    void posterAvailable().then((ok) => {
      if (!cancelled && ok) setPoster('loading');
    });
    if (!reduced && !isMobileViewport()) {
      void videoAvailable().then((ok) => {
        if (!cancelled && ok) setVideo('loading');
      });
    }
    return () => {
      cancelled = true;
    };
  }, [reduced]);

  return (
    <div className={`hunt3-backdrop ${entering ? 'hunt3-enter-room' : ''}`} aria-hidden data-testid="hunt-backdrop">
      <div className="hunt3-video-fallback" />
      {poster !== 'none' && (
        <img
          src={CINEMATIC.poster}
          alt=""
          className={`hunt3-poster ${poster === 'ready' ? 'is-ready' : ''}`}
          onLoad={() => setPoster('ready')}
          onError={() => setPoster('none')}
          data-testid="hunt-poster"
        />
      )}
      {video !== 'none' && (
        <video
          className={`hunt3-video ${video === 'ready' ? 'is-ready' : ''}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          tabIndex={-1}
          onLoadedData={() => setVideo('ready')}
          onCanPlay={() => setVideo('ready')}
          onError={() => setVideo('none')}
          data-testid="hunt-video"
        >
          <source src={CINEMATIC.webm} type="video/webm" />
          <source src={CINEMATIC.mp4} type="video/mp4" onError={() => setVideo('none')} />
        </video>
      )}
      <div className="hunt3-video-shade" />
      <img src={`${BASE}hunt-assets/hunt-radar-orbit.svg`} alt="" className="hunt3-radar" />
      <img src={`${BASE}hunt-assets/hunt-target-lock.svg`} alt="" className="hunt3-target-art" />
      <img src={`${BASE}hunt-assets/hunt-hero-network.svg`} alt="" className="hunt3-network" />
      <img src={`${BASE}hunt-assets/hunt-horizon.svg`} alt="" className="hunt3-horizon" />
      <div className="hunt3-vignette" />
    </div>
  );
});
