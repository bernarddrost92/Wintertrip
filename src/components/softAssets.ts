/**
 * The supplied "quiet 007" line assets (public/ui/007-soft/, from the
 * Visual Polish Pack). Pre-designed on purpose: no radar/HUD lines are drawn
 * in code any more — every decorative line in the daily screens is one of
 * these files at low opacity.
 */
export type SoftAsset =
  | 'soft-radar-corner'
  | 'soft-arc-bottom-left'
  | 'soft-crosshair'
  | 'soft-divider'
  | 'soft-corner-brackets'
  | 'soft-grid';

export function softAssetUrl(name: SoftAsset): string {
  return `${import.meta.env.BASE_URL}ui/007-soft/${name}.svg`;
}
