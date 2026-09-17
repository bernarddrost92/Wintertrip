import { useState, type FormEvent } from 'react';
import { Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { signInTeamZwolle } from './teamZwolleAuth';

type Status = 'idle' | 'submitting' | 'invalid-credentials' | 'network';

/**
 * The outermost gate — sits in front of the entire app, including the
 * existing Mission Gate/intro/session flow. Real Supabase Auth: one shared
 * Team Zwolle password signs everyone into the same technical account (see
 * teamZwolleAuth.ts) — never a personal email, OTP, or magic link, and the
 * technical account's email is never shown here. A successful sign-in
 * produces a real, persistent Supabase session and this component doesn't
 * need to do anything else itself: App.tsx's useSupabaseAuthSession picks
 * up the resulting SIGNED_IN event via onAuthStateChange and re-renders
 * past this gate on its own — there is no local "authorized" flag here.
 */
export function AccessGate() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    const result = await signInTeamZwolle(password);
    if (result.ok) return;
    setStatus(result.reason);
    setPassword('');
  }

  const denied = status === 'invalid-credentials';
  const networkIssue = status === 'network';
  const submitting = status === 'submitting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mission-void/70 px-4 animate-[intro-quickfade_0.5s_ease-out_both]">
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 border border-gold/25 bg-mission-void/80 px-8 py-12 text-center shadow-gold-lg backdrop-blur-sm">
        <span className="flex h-14 w-14 items-center justify-center border border-gold/50 text-gold" aria-hidden>
          <Lock size={26} />
        </span>

        <div className="space-y-1.5">
          <p className="font-display text-lg font-bold tracking-[0.1em] text-ink">007 — Operatie Wintertrip 2027</p>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold/80">Team Zwolle</p>
          <p className="font-display text-xl font-bold uppercase leading-tight tracking-[0.08em] text-gold-gradient bg-gold-sweep bg-[length:200%_auto] bg-clip-text text-transparent">
            Mission Access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <label htmlFor="team-zwolle-password" className="block font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
            Wachtwoord
          </label>
          <input
            id="team-zwolle-password"
            type="password"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (status === 'invalid-credentials' || status === 'network') setStatus('idle');
            }}
            disabled={submitting}
            className="w-full border border-white/15 bg-mission-raised px-4 py-3.5 text-center text-base text-ink tracking-[0.2em] placeholder:text-ink-muted/50 transition-colors focus:border-gold focus:outline-none disabled:opacity-60 [color-scheme:dark]"
            placeholder="••••••"
            autoFocus
          />
          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="mt-2 flex w-full items-center justify-center gap-2 border border-gold bg-gold/10 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.24em] text-gold shadow-gold transition-colors duration-150 hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 size={15} className="animate-spin" aria-hidden />}
            {submitting ? 'Verifying…' : 'Enter Mission'}
          </button>
        </form>

        <div
          role="status"
          aria-live="polite"
          className={`flex flex-col items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-red-400 transition-opacity duration-200 ${
            denied || networkIssue ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <ShieldAlert size={13} aria-hidden />
            {denied ? 'Toegang Geweigerd' : networkIssue ? 'Verbinding Mislukt' : ''}
          </span>
          <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-ink-muted">
            {denied ? 'Controleer het wachtwoord en probeer opnieuw.' : networkIssue ? 'Probeer het opnieuw.' : ''}
          </span>
        </div>

        <p className="text-[10px] uppercase tracking-[0.3em] text-ink-dim">Authorized Personnel Only</p>
      </div>
    </div>
  );
}
