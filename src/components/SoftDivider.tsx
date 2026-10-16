import { softAssetUrl } from './softAssets';

/** The supplied soft-divider line — separates a page's hero zone from its data zone. */
export function SoftDivider({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none h-6 w-full bg-center bg-no-repeat opacity-[0.28] ${className}`}
      style={{ backgroundImage: `url("${softAssetUrl('soft-divider')}")`, backgroundSize: 'contain' }}
      aria-hidden
    />
  );
}
