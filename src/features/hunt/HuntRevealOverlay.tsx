import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { REVEAL_SWAP_MS } from './huntTimeline';


interface HuntRevealOverlayProps {
  eyebrow: string;
  text: string;
  /** "mission" = a sentence (smaller, sentence case); "line" = a one-liner. */
  kind: 'mission' | 'line';
  againLabel: string;
  onAgain: () => void;
  onClose: () => void;
}

/** A one-liner's last sentence lights up gold: "STOP MET KIJKEN NAAR DE
 * STAND. VERANDER HEM." → the second sentence in gold. */
function splitForGold(text: string): [string, string] {
  const match = text.match(/^(.*[.!?])\s+(\S.*)$/);
  return match ? [match[1], match[2]] : ['', text];
}

/**
 * The cinematic reveal for GEEF MIJ EEN MISSIE and MOTIVATIE NODIG?: one large
 * line on a dark field (the Hunt Room stays faintly visible behind it) with
 * the target lock art. NOG EEN / NOG ÉÉN swaps the line in place — the old
 * one fades and slides out briefly, the new one locks in — without
 * remounting the overlay. A one-liner's gold last line gets a single gold
 * sweep on entry, never a loop. No confetti.
 *
 * A small modal of its own: Escape closes this reveal first (it never
 * reaches Hunt Mode underneath), focus stays inside and returns — without
 * scrolling the room — to the button that opened it. With reduced motion
 * lines swap instantly.
 */
export function HuntRevealOverlay({ eyebrow, text, kind, againLabel, onAgain, onClose }: HuntRevealOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(text);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    againRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (text === shown) return;
    if (reduced) {
      setShown(text);
      return;
    }
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setShown(text);
      setLeaving(false);
    }, REVEAL_SWAP_MS);
    return () => window.clearTimeout(timer);
  }, [text, shown, reduced]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !ref.current) return;
    event.stopPropagation();
    const buttons = Array.from(ref.current.querySelectorAll<HTMLButtonElement>('button'));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const [lead, gold] = kind === 'line' ? splitForGold(shown) : ['', ''];

  return (
    <div ref={ref} className="hunt3-reveal" role="dialog" aria-modal="true" aria-label={eyebrow} onKeyDown={handleKeyDown} data-testid="hunt-reveal">
      <img src={`${import.meta.env.BASE_URL}hunt-assets/hunt-target-lock.svg`} alt="" aria-hidden />
      <div className="hunt3-reveal-inner">
        <p className="hunt3-reveal-eyebrow">{eyebrow}</p>
        <blockquote
          key={shown}
          className={`${leaving ? 'hunt3-reveal-out' : 'hunt3-reveal-in'} ${kind === 'mission' ? 'hunt3-reveal-mission' : ''}`}
          data-testid="hunt-reveal-text"
          data-text={shown}
          aria-live="polite"
        >
          {kind === 'mission' ? (
            shown
          ) : (
            <>
              {lead && (
                <>
                  {lead}
                  <br />
                </>
              )}
              <span className="hunt3-gold-line">{gold}</span>
            </>
          )}
        </blockquote>
        <div className="hunt3-reveal-actions">
          <button ref={againRef} type="button" onClick={onAgain}>
            {againLabel}
          </button>
          <button type="button" onClick={onClose}>
            Terug naar room
          </button>
        </div>
        <p className="hunt3-reveal-hint">Esc om terug te gaan</p>
      </div>
    </div>
  );
}
