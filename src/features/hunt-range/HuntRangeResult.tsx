import { useState } from 'react';
import { ArrowRight, RotateCcw, Target } from 'lucide-react';
import { HUNT_MISSIONS, pickDifferent } from '../hunt/huntLines';
import { RANGE_FTE_EARNED, resultVerdict } from './huntRangeLines';

interface HuntRangeResultProps {
  hits: number;
  total: number;
  onPakFteBon: () => void;
  onAgain: () => void;
  onBack: () => void;
  random?: () => number;
}

/**
 * The end of a round — and the punchline: however well you shot, the FTE
 * earned is 0,00. The score is never stored and changes no ranking, FTE,
 * VCDB or league data; PAK FTE-BON is the one gold way out.
 */
export function HuntRangeResult({ hits, total, onPakFteBon, onAgain, onBack, random = Math.random }: HuntRangeResultProps) {
  const [mission, setMission] = useState<(typeof HUNT_MISSIONS)[number] | null>(null);
  const earned = RANGE_FTE_EARNED.toFixed(2).replace('.', ',');

  return (
    <div className="hr-result" data-testid="range-result">
      <p className="hr-result-score">
        {hits} / {total} targets hit
      </p>
      <p className="hr-result-verdict">{resultVerdict(hits, total)}</p>
      <div className="hr-result-earned">
        <span>FTE verdiend</span>
        <strong data-testid="range-fte-earned">{earned}</strong>
      </div>
      <p className="hr-result-punch">Tijd voor het echte werk.</p>
      <p className="hr-result-note">Je score verandert geen ranking, geen FTE, geen VCDB en geen league-data. Alleen echte salesacties doen dat.</p>

      {mission && (
        <p className="hr-result-mission" role="status" data-testid="range-mission">
          {mission}
        </p>
      )}

      <div className="hr-result-actions">
        <button type="button" onClick={onPakFteBon} className="hunt3-button hunt3-button-primary hr-result-primary">
          Pak FTE-bon <ArrowRight size={17} aria-hidden />
        </button>
        <button type="button" onClick={() => setMission((current) => pickDifferent(HUNT_MISSIONS, current, random))} className="hunt3-button hunt3-button-secondary">
          <Target size={15} aria-hidden /> Geef mij een sales missie
        </button>
        <button type="button" onClick={onAgain} className="hunt3-button hunt3-button-secondary">
          <RotateCcw size={15} aria-hidden /> Nog een ronde
        </button>
        <button type="button" onClick={onBack} className="hunt3-button hunt3-button-secondary">
          Terug naar Hunt Room
        </button>
      </div>
    </div>
  );
}
