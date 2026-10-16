import { useEffect, useRef, type KeyboardEvent } from 'react';

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
 * The cinematic reveal for GEEF MIJ EEN MISSIE and GEEF ME VUUR (supplied
 * HuntRevealOverlay direction): one large line on a dark field with the
 * target lock behind it. A small modal of its own — Escape closes this
 * reveal first (it never reaches Hunt Mode underneath), focus stays inside
 * and returns to the button that opened it. No confetti.
 */
export function HuntRevealOverlay({ eyebrow, text, kind, againLabel, onAgain, onClose }: HuntRevealOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    againRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

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

  const [lead, gold] = kind === 'line' ? splitForGold(text) : ['', ''];

  return (
    <div
      ref={ref}
      className="hunt3-reveal animate-[intro-quickfade_0.3s_ease-out_both]"
      role="dialog"
      aria-modal="true"
      aria-label={eyebrow}
      onKeyDown={handleKeyDown}
      data-testid="hunt-reveal"
    >
      <img src={`${import.meta.env.BASE_URL}hunt-assets/hunt-target-lock.svg`} alt="" aria-hidden />
      <div className="hunt3-reveal-inner">
        <p>{eyebrow}</p>
        <blockquote key={text} className={`animate-target-lock ${kind === 'mission' ? 'hunt3-reveal-mission' : ''}`} data-testid="hunt-reveal-text" data-text={text} aria-live="polite">
          {kind === 'mission' ? (
            text
          ) : (
            <>
              {lead && (
                <>
                  {lead}
                  <br />
                </>
              )}
              <span>{gold}</span>
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
