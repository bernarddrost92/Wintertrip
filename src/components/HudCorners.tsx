import { softAssetUrl } from './softAssets';

const CORNERS = [
  { position: 'left top', className: 'left-0 top-0' },
  { position: 'right top', className: 'right-0 top-0' },
  { position: 'left bottom', className: 'bottom-0 left-0' },
  { position: 'right bottom', className: 'bottom-0 right-0' },
];

/**
 * Four viewfinder corners — cropped from the supplied soft-corner-brackets
 * asset (each corner box shows just its own bracket of the half-scale
 * artwork), so a focal screen gets the brackets without them stretching.
 * Use on the one command screen per page, not on every card.
 */
export function HudCorners() {
  return (
    <>
      {CORNERS.map(({ position, className }) => (
        <span
          key={position}
          className={`pointer-events-none absolute h-12 w-12 opacity-50 ${className}`}
          style={{ backgroundImage: `url("${softAssetUrl('soft-corner-brackets')}")`, backgroundSize: '340px 210px', backgroundPosition: position, backgroundRepeat: 'no-repeat' }}
          aria-hidden
        />
      ))}
    </>
  );
}
