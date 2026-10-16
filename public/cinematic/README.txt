HUNT MODE — CINEMATIC ASSET CONTRACT
====================================

Hunt Mode expects exactly these files in this folder (no other names):

  /cinematic/hunt-room-loop.webm    1. preferred loop
  /cinematic/hunt-room-loop.mp4     2. fallback loop
  /cinematic/hunt-room-poster.webp  3. still poster

Priority: webm → mp4 → poster → the built-in SVG/CSS fallback scene.

Content rules: no text, no numbers or rankings, no logos. Slow, premium
intelligence-room camera motion in charcoal / warm gold / black. The app
overlays all live data as HTML.

Behaviour (src/features/hunt/HuntBackdrop.tsx, cinematicAssets.ts):
- Each file is checked once per page load (HEAD). Missing files are fine:
  the SVG/CSS fallback stays, nothing breaks, no repeated requests.
- Poster and video start invisible and fade in only once loaded, on top
  of the fallback — no black frame, no pop, no layout shift.
- The loop is muted, looping, playsInline, preload="metadata",
  object-fit: cover, under a dark shade so text stays legible.
- No video at all at ≤720px wide or with prefers-reduced-motion
  (the poster / SVG fallback is used instead).
- The backdrop stays mounted for the whole Hunt Mode session: reveals,
  the War Room and other state changes never restart the loop.
