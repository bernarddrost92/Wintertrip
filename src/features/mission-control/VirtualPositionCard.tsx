import { getPodiumState } from '../../services/podiumStatus';
import type { PodiumState } from '../../services/podiumStatus';
import type { RankingSnapshot } from '../../types/missionSnapshot';

type MedalState = Exclude<PodiumState, 'awaiting'>;

const STATE_LABEL: Record<MedalState, string> = {
  gold: 'Gold Position',
  silver: 'Silver Position',
  bronze: 'Bronze Position',
  default: 'In Pursuit',
};

const CARD_CLASSES: Record<MedalState, string> = {
  gold: 'border-gold/50 shadow-podium-gold',
  silver: 'border-silver/40 shadow-podium-silver',
  bronze: 'border-bronze/40 shadow-podium-bronze',
  default: 'border-gold/15',
};

const NUMBER_CLASSES: Record<MedalState, string> = {
  gold: 'text-7xl sm:text-8xl text-gold drop-shadow-[0_0_28px_rgba(241,196,83,0.55)]',
  silver: 'text-6xl sm:text-7xl text-silver',
  bronze: 'text-6xl sm:text-7xl text-bronze',
  default: 'text-5xl sm:text-6xl text-ink',
};

/**
 * Team Zwolle's virtual League position — a quiet, cinematic podium effect
 * for #1-#3 that gets visibly calmer each rank down (gold: pulsing glow +
 * an occasional edge flare; silver: a faint cool shimmer; bronze: barely
 * any movement), and a plain Mission Control card for #4+. All animation
 * is CSS-only and frozen by the app's global prefers-reduced-motion rule.
 * With no ranking snapshot yet (see services/missionSnapshot.ts) this
 * never shows a #0 or a guessed position — only Awaiting Intelligence.
 */
export function VirtualPositionCard({ ranking }: { ranking: RankingSnapshot }) {
  const state = getPodiumState(ranking.virtualPosition);

  if (state === 'awaiting') {
    return (
      <div className="panel p-6 text-center sm:p-8 sm:text-left" data-podium-state="awaiting">
        <p className="label-classified text-gold/70">Virtual Position</p>
        <p className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-ink-muted">Awaiting Intelligence</p>
      </div>
    );
  }

  return (
    <div className={`panel relative overflow-hidden p-6 text-center sm:p-8 sm:text-left ${CARD_CLASSES[state]}`} data-podium-state={state}>
      {state === 'gold' && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-panel-glow animate-podium-pulse-gold" aria-hidden />
          <div className="podium-flare" aria-hidden />
        </>
      )}
      {state === 'silver' && (
        <div
          className="pointer-events-none absolute inset-0 animate-podium-shimmer-silver"
          style={{ background: 'radial-gradient(120% 80% at 20% 0%, rgba(232,236,240,0.12), transparent 60%)' }}
          aria-hidden
        />
      )}
      {state === 'bronze' && (
        <div
          className="pointer-events-none absolute inset-0 animate-podium-pulse-bronze"
          style={{ background: 'radial-gradient(120% 80% at 20% 0%, rgba(205,127,50,0.1), transparent 60%)' }}
          aria-hidden
        />
      )}

      <div className="relative">
        <p className="label-classified text-gold/70">Virtual Position</p>
        <p className={`mt-2 font-display font-black leading-none tabular-nums ${NUMBER_CLASSES[state]}`}>#{ranking.virtualPosition}</p>
        <p className="mt-2 text-lg font-semibold uppercase tracking-wide text-ink">Team Zwolle</p>
        <p className="label-classified mt-1">{STATE_LABEL[state]}</p>
      </div>
    </div>
  );
}
