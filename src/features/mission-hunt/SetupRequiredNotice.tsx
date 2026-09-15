import { Lock } from 'lucide-react';

/**
 * Shown instead of Mission Hunt whenever VITE_SUPABASE_URL / _ANON_KEY are
 * unset (spec section 33) — never a crash, never fake/local data standing in
 * for the real team database. See MISSION_HUNT_SETUP.md for the steps that
 * make this go away.
 */
export function SetupRequiredNotice() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center border border-gold/40 bg-mission-raised text-gold">
        <Lock size={20} aria-hidden />
      </span>
      <p className="mt-6 label-classified text-gold/70">Mission Hunt</p>
      <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-wide text-ink">Setup Required</h1>
      <p className="mt-4 text-sm text-ink-muted">
        Mission Hunt heeft nog geen backend-configuratie. Zie <span className="text-ink">MISSION_HUNT_SETUP.md</span> in de repository voor de stappen om dit
        onderdeel te activeren.
      </p>
    </div>
  );
}
