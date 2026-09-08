import { useState } from 'react';
import { AccessGate } from './features/access/AccessGate';
import { hasAccess, resetAccess } from './features/access/accessStorage';
import { CommandFrame } from './components/CommandFrame';
import { ControlRoomEnvironment } from './components/ControlRoomEnvironment';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { MissionControlCalculator } from './features/calculator/MissionControlCalculator';
import { MissionHomepage } from './features/home/MissionHomepage';
import { AccessTransition } from './features/home/AccessTransition';
import { hasSeenIntro, markIntroSeen } from './features/intro/introStorage';
import { MissionGate } from './features/intro/MissionGate';
import { MissionIntroSequence } from './features/intro/MissionIntroSequence';
import { LeagueCheckPage } from './features/league-check/LeagueCheckPage';
import { MissionControlPage } from './features/mission-control/MissionControlPage';
import { MissionFlowProvider } from './features/missionFlow/MissionFlowProvider';
import { SoundtrackProvider } from './features/soundtrack/SoundtrackProvider';
import type { AppView } from './types/navigation';

type GatePhase = 'gate' | 'intro' | 'ready';

const ACCESS_LABEL: Record<AppView, string> = {
  home: 'ACCESSING MISSION HOME...',
  calculator: 'ACCESSING MISSION CALCULATOR...',
  'league-check': 'ACCESSING LEAGUE CHECK...',
  'mission-control': 'ACCESSING MISSION CONTROL...',
};

const TRANSITION_MS = 650;

/**
 * Navigation is plain client-side state rather than a router: GitHub Pages
 * serves this as a static single-page app with no server-side rewrite
 * rules, so path-based routes would 404 on refresh/deep-link.
 *
 * Two independent gates sit in front of the app, outermost first:
 *
 * 1. The Access Gate (device-scoped, localStorage) — a simple client-side
 *    password check keeping casual visitors out of the public GitHub Pages
 *    URL. Entered once per device; nothing else renders until it clears.
 * 2. The existing session-scoped Mission Gate/intro flow (sessionStorage,
 *    untouched by this): a first-time visitor clears ACCEPT MISSION,
 *    watches the intro once, then always lands on the Mission Homepage. A
 *    refresh within the same session skips straight back to "ready".
 *
 * Resetting access (Footer's RESET ACCESS) only clears the outer gate — the
 * inner intro/session state is left exactly as it was.
 */
export default function App() {
  const [accessGranted, setAccessGranted] = useState(() => hasAccess());
  const [gatePhase, setGatePhase] = useState<GatePhase>(() => (hasSeenIntro() ? 'ready' : 'gate'));
  const [view, setView] = useState<AppView>('home');
  const [transition, setTransition] = useState<AppView | null>(null);

  function handleResetAccess() {
    resetAccess();
    setAccessGranted(false);
  }

  function handleGateAccept() {
    setGatePhase('intro');
  }

  function handleIntroComplete() {
    markIntroSeen();
    setGatePhase('ready');
    setView('home');
  }

  function handleReplayIntro() {
    setGatePhase('intro');
  }

  /** A short "ACCESSING…" beat before landing in a section — used both for
   * the mission-briefing choice cards and for RUN LEAGUE CHECK continuing
   * the mission from the calculator. Header navigation switches views
   * instantly — that transition is for the "entering the operation" moment,
   * not every click thereafter. */
  function handleNavigate(target: AppView) {
    setTransition(target);
    window.setTimeout(() => {
      setView(target);
      setTransition(null);
    }, TRANSITION_MS);
  }

  return (
    <SoundtrackProvider>
      <MissionFlowProvider>
        <div className="relative min-h-screen overflow-x-hidden bg-mission-void">
          <ControlRoomEnvironment />

          {!accessGranted ? (
            <AccessGate onAuthorized={() => setAccessGranted(true)} />
          ) : (
            <>
              {gatePhase === 'gate' && <MissionGate onAccept={handleGateAccept} />}
              {gatePhase === 'intro' && <MissionIntroSequence onComplete={handleIntroComplete} />}

              {gatePhase === 'ready' && (
                <div className="relative z-10 flex min-h-screen flex-col">
                  <Navbar current={view} onNavigate={setView} />
                  <main className="flex-1">
                    {view === 'home' && <MissionHomepage onSelect={handleNavigate} />}
                    {view === 'calculator' && <MissionControlCalculator onRunLeagueCheck={() => handleNavigate('league-check')} />}
                    {view === 'league-check' && (
                      <CommandFrame>
                        <LeagueCheckPage />
                      </CommandFrame>
                    )}
                    {view === 'mission-control' && (
                      <CommandFrame>
                        <MissionControlPage />
                      </CommandFrame>
                    )}
                  </main>
                  <Footer onReplayIntro={handleReplayIntro} onResetAccess={handleResetAccess} />
                </div>
              )}

              {transition && <AccessTransition label={ACCESS_LABEL[transition]} />}
            </>
          )}
        </div>
      </MissionFlowProvider>
    </SoundtrackProvider>
  );
}
