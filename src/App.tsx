import { useState } from 'react';
import { CommandFrame } from './components/CommandFrame';
import { ControlRoomEnvironment } from './components/ControlRoomEnvironment';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { MissionControlCalculator } from './features/calculator/MissionControlCalculator';
import { LeagueCheckPage } from './features/league-check/LeagueCheckPage';
import { MissionControlPage } from './features/mission-control/MissionControlPage';
import type { AppView } from './types/navigation';

/**
 * Navigation is plain client-side state rather than a router: GitHub Pages
 * serves this as a static single-page app with no server-side rewrite
 * rules, so path-based routes would 404 on refresh/deep-link. The Mission
 * Control Calculator is the default view — there is no marketing homepage
 * gating access to it.
 */
export default function App() {
  const [view, setView] = useState<AppView>('calculator');

  return (
    <div className="relative z-0 min-h-screen">
      <ControlRoomEnvironment />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar current={view} onNavigate={setView} />
        <main className="flex-1">
          {view === 'calculator' && <MissionControlCalculator />}
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
        <Footer />
      </div>
    </div>
  );
}
