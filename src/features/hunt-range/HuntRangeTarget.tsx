import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import type { RangeAppearance } from './huntRangeLines';

/** How long a hit target takes to fold away before it leaves the lane. */
export const HIT_CLEAR_MS = 650;

export type RangeTargetMode = 'slide-ltr' | 'slide-rtl' | 'popup' | 'board';

interface HuntRangeTargetProps {
  appearance: RangeAppearance;
  hit: boolean;
  mode: RangeTargetMode;
  /** Travel / visible time in ms — after it the target is gone (a miss). */
  durationMs: number;
  /** Horizontal position for a pop-up target, percent of the lane. */
  popX: number;
  onHit: (id: string) => void;
  onMiss: (id: string) => void;
  onCleared: (id: string) => void;
}

/**
 * One black cardboard training target on the range — an abstract
 * silhouette (no face, no person) carrying a vestiging's name and Net FTE
 * rank. It slides along the rail or pops up; a click folds it back with a
 * gold impact mark. Transform/opacity only.
 */
export function HuntRangeTarget({ appearance, hit, mode, durationMs, popX, onHit, onMiss, onCleared }: HuntRangeTargetProps) {
  const { id, target, next } = appearance;
  const [impact, setImpact] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (hit || mode === 'board') return;
    const timer = window.setTimeout(() => onMiss(id), durationMs);
    return () => window.clearTimeout(timer);
  }, [hit, mode, durationMs, id, onMiss]);

  useEffect(() => {
    if (!hit) return;
    const timer = window.setTimeout(() => onCleared(id), HIT_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [hit, id, onCleared]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (hit) return;
    const rect = event.currentTarget.getBoundingClientRect();
    // Keyboard activation has no pointer position: mark the centre.
    const fromPointer = event.detail > 0 && rect.width > 0;
    setImpact({
      x: fromPointer ? ((event.clientX - rect.left) / rect.width) * 100 : 50,
      y: fromPointer ? ((event.clientY - rect.top) / rect.height) * 100 : 50,
    });
    onHit(id);
  }

  const style = { '--hr-dur': `${durationMs}ms`, '--hr-x': `${popX}%` } as CSSProperties;

  return (
    <div className={`hr-track hr-m-${mode}`} style={style} data-hit={hit || undefined} data-testid="range-target">
      <button
        type="button"
        className={`hr-target ${next ? 'hr-target-next' : ''}`}
        onClick={handleClick}
        aria-disabled={hit || undefined}
        aria-label={`${next ? 'Next target' : 'Target'} ${target.team} #${target.rank}`}
      >
        <span className="hr-hanger" aria-hidden />
        <span className="hr-card" aria-hidden>
          <svg className="hr-silhouette" viewBox="0 0 120 180" focusable="false">
            <circle cx="60" cy="30" r="21" />
            <path d="M12 180V96c0-22 16-36 38-38h20c22 2 38 16 38 38v84z" />
            <ellipse className="hr-ring" cx="60" cy="118" rx="30" ry="38" />
            <ellipse className="hr-ring" cx="60" cy="118" rx="15" ry="19" />
          </svg>
          <span className="hr-label">
            <span className="hr-tag">{next ? 'Next target' : 'Target'}</span>
            <span className={`hr-city ${target.team.length > 9 ? 'hr-city-long' : ''}`}>{target.team}</span>
            <span className="hr-rank">#{target.rank}</span>
          </span>
          {impact && <span className="hr-impact" style={{ left: `${impact.x}%`, top: `${impact.y}%` }} />}
        </span>
      </button>
    </div>
  );
}
