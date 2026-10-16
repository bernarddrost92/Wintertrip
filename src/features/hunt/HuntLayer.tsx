import { useCallback, useState } from 'react';
import { HuntActivation } from './HuntActivation';
import { HuntModeOverlay } from './HuntModeOverlay';
import { useHuntMode } from './huntModeContext';

interface HuntLayerProps {
  /** Opens the existing FTE Bon Calculator (Net FTE view). */
  onPakFteBon: () => void;
}

/**
 * Everything HUNT MODE adds on top of the app: the MISSION ACTIVATED
 * moment (flash, confetti, target lock) on a deliberate activation and the fullscreen Hunt overlay. Renders nothing
 * in QUIET MODE, so the daily screens stay exactly as they are.
 */
export function HuntLayer({ onPakFteBon }: HuntLayerProps) {
  const { active, activationId, exit } = useHuntMode();
  const [confettiDoneFor, setConfettiDoneFor] = useState(0);
  const finishConfetti = useCallback(() => setConfettiDoneFor(activationId), [activationId]);

  return (
    <>
      {active && (
        <HuntModeOverlay
          key={activationId}
          showIntro={activationId > 0}
          onExit={exit}
          onPakFteBon={() => {
            exit();
            onPakFteBon();
          }}
        />
      )}
      {active && activationId > 0 && confettiDoneFor !== activationId && <HuntActivation key={activationId} onDone={finishConfetti} />}
    </>
  );
}
