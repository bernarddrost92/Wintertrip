import { useEffect, useMemo, type CSSProperties } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const PIECE_COUNT = 80;
const BURST_MS = 2100;
const GOLDS = ['#D6AE55', '#E7C875', '#B38C3E', '#F2DEA0', '#C9A04A'];

interface Piece {
  left: number;
  width: number;
  height: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
}

function makePieces(random: () => number): Piece[] {
  return Array.from({ length: PIECE_COUNT }, () => {
    const strip = random() < 0.35;
    return {
      left: random() * 100,
      width: strip ? 2 + random() * 2 : 5 + random() * 6,
      height: strip ? 14 + random() * 12 : 7 + random() * 7,
      color: GOLDS[Math.floor(random() * GOLDS.length)],
      delay: random() * 380,
      duration: 1300 + random() * 600,
      drift: (random() - 0.5) * 220,
      spin: (random() < 0.5 ? -1 : 1) * (360 + random() * 540),
    };
  });
}

interface GoldConfettiProps {
  /** Called once the burst is over, so the parent can unmount it. */
  onDone: () => void;
  /** Start the burst this much later (the Hunt activation fires it at 0.9s). */
  delayMs?: number;
  random?: () => number;
}

/**
 * One chic burst of small gold rectangles and strips, plus a short gold
 * flash — Hunt Mode's activation moment. Pure CSS transform/opacity, no
 * canvas, no loop: it calls onDone after ~2s and the parent removes it.
 * With prefers-reduced-motion it renders nothing and finishes immediately.
 */
export function GoldConfetti({ onDone, delayMs = 0, random = Math.random }: GoldConfettiProps) {
  const reduced = usePrefersReducedMotion();
  const pieces = useMemo(() => makePieces(random), [random]);

  useEffect(() => {
    const timer = window.setTimeout(onDone, reduced ? 0 : delayMs + BURST_MS);
    return () => window.clearTimeout(timer);
  }, [onDone, reduced, delayMs]);

  if (reduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[88] overflow-hidden" aria-hidden data-testid="gold-confetti">
      <div className="absolute inset-0 animate-gold-flash" style={{ animationDelay: `${delayMs}ms`, background: 'radial-gradient(80% 70% at 50% 40%, rgba(242,222,160,0.9), rgba(214,174,85,0.45) 55%, transparent 80%)' }} />
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="absolute top-0 block animate-confetti-fall will-change-transform"
          style={
            {
              left: `${piece.left}%`,
              width: `${piece.width}px`,
              height: `${piece.height}px`,
              background: piece.color,
              boxShadow: '0 0 6px rgba(231,200,117,0.35)',
              animationDuration: `${piece.duration}ms`,
              animationDelay: `${delayMs + piece.delay}ms`,
              '--confetti-drift': `${piece.drift}px`,
              '--confetti-spin': `${piece.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
