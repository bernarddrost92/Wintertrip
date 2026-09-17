import { lazy, Suspense, useState } from 'react';
import { AccessGate } from './features/access/AccessGate';
import { signOutTeamZwolle, useSupabaseAuthSession } from './features/access/teamZwolleAuth';
import { isSupabaseConfigured } from './lib/supabaseClient';
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
import { MissionUpdatesPage } from './features/mission-updates/MissionUpdatesPage';
import { MissionHuntErrorBoundary } from './features/mission-hunt/MissionHuntErrorBoundary';
import { MissionFlowProvider } from './features/missionFlow/MissionFlowProvider';
import { SoundtrackProvider } from './features/soundtrack/SoundtrackProvider';
import type { AppView } from './types/navigation';
import { clearDeepLinkParam, readDeepLinkView } from './utils/deepLink';

// Mission Hunt pulls in the Supabase client and SheetJS (xlsx) — both sizable
// and irrelevant to every other view — so it's loaded on demand rather than
// bundled into the JS every visitor downloads just to see the homepage.
const MissionHuntPage = lazy(() => import('./features/mission-hunt/MissionHuntPage').then((m) => ({ default: m.MissionHuntPage })));

type GatePhase = 'gate' | 'intro' | 'ready';

const ACCESS_LABEL: Record<AppView, string> = {
  home: 'ACCESSING MISSION HOME...',
  calculator: 'ACCESSING MISSION CALCULATOR...',
  'league-check': 'ACCESSING LEAGUE CHECK...',
  'mission-control': 'ACCESSING MISSION CONTROL...',
  'mission-updates': 'ACCESSING MISSION UPDATES...',
  'mission-hunt': 'ACCESSING MISSION HUNT...',
};

const TRANSITION_MS = 650;

/**
 * Navigation is plain client-side state rather than a router: GitHub Pages
 * serves this as a static single-page app with no server-side rewrite
 * rules, so path-based routes would 404 on refresh/deep-link.
 *
 * Two independent gates sit in front of the app, outermost first:
 *
 * 1. The Access Gate — real Supabase Auth now (see features/access/
 *    teamZwolleAuth.ts): one shared Team Zwolle password signs everyone
 *    into the same technical Supabase account, producing a real, persistent
 *    session (not a localStorage flag). Nothing else renders until a valid
 *    session exists. Every protected table's RLS now only allows the
 *    `authenticated` role — see migration 0010 — so there is no route left
 *    where the app can reach that data without this gate having cleared.
 * 2. The existing session-scoped Mission Gate/intro flow (sessionStorage,
 *    untouched by this): a first-time visitor clears ACCEPT MISSION,
 *    watches the intro once, then always lands on the Mission Homepage. A
 *    refresh within the same session skips straight back to "ready".
 *
 * UITLOGGEN (Footer) ends the shared Supabase session and returns to the
 * Access Gate — it never touches the inner intro/session state, and it is
 * a completely different action from Mission Hunt's own WISSEL PERSOON
 * (which only clears the locally selected WIE BEN JIJ? person and leaves
 * this Supabase session untouched).
 */
export default function App() {
  const { loading: authLoading, session } = useSupabaseAuthSession();
  const [gatePhase, setGatePhase] = useState<GatePhase>(() => (hasSeenIntro() ? 'ready' : 'gate'));
  // A bookmarked/shared /mission-updates link survives GitHub Pages' lack of
  // server-side routing via public/404.html + this restore — see
  // utils/deepLink.ts. Still fully gated: this only ever picks which view
  // renders once the auth session/gatePhase actually clear it to render at all.
  const [view, setView] = useState<AppView>(() => {
    const deepLinkView = readDeepLinkView();
    if (deepLinkView) clearDeepLinkParam();
    return deepLinkView ?? 'home';
  });
  const [transition, setTransition] = useState<AppView | null>(null);

  /** A rejected React.lazy() import (the chunk 404ing — a stale cached
   * index.html after a redeploy, or any transient fetch failure) doesn't
   * just get cached on the lazy object: confirmed by direct testing, the
   * browser's module loader itself won't re-fetch a specifier it has
   * already failed to load once, for the rest of the page's lifetime — so
   * no in-place React trick (new lazy() instance, remounting) reliably
   * retries it. A full navigation is the only thing that reliably does.
   * Routes back through the same public/404.html deep-link mechanism used
   * for a shared /mission-hunt link, so RETRY lands the user back on
   * Mission Hunt (not the homepage) once the fresh load completes. */
  function handleMissionHuntRetry() {
    window.location.href = `${import.meta.env.BASE_URL}?redirect=mission-hunt`;
  }

  function handleLogout() {
    void signOutTeamZwolle();
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

          {!isSupabaseConfigured() ? (
            <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="label-classified text-gold/70">007 — Operatie Wintertrip 2027</p>
              <p className="font-display text-xl font-bold uppercase tracking-wide text-ink">Setup Required</p>
              <p className="max-w-sm text-sm text-ink-muted">Supabase is not configured for this build — the shared Team Zwolle access gate cannot be reached.</p>
            </div>
          ) : authLoading ? (
            <div className="flex min-h-screen items-center justify-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Verifying access…</p>
            </div>
          ) : !session ? (
            <AccessGate />
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
                    {view === 'mission-updates' && <MissionUpdatesPage />}
                    {view === 'mission-hunt' && (
                      <MissionHuntErrorBoundary onRetry={handleMissionHuntRetry} onBackHome={() => setView('home')}>
                        <Suspense
                          fallback={
                            <p className="px-4 py-20 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Loading project intelligence…</p>
                          }
                        >
                          <MissionHuntPage />
                        </Suspense>
                      </MissionHuntErrorBoundary>
                    )}
                  </main>
                  <Footer onReplayIntro={handleReplayIntro} onLogout={handleLogout} />
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
