import { useState, type FormEvent } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { grantAccess } from './accessStorage';

interface AccessGateProps {
  onAuthorized: () => void;
}

/** Exact, case-sensitive access code — "Zwolle" only, never "zwolle" or "ZWOLLE". */
const ACCESS_CODE = 'Zwolle';

/**
 * The outermost gate — sits in front of the entire app, including the
 * existing Mission Gate/intro/session flow. A simple client-side check, not
 * real authentication: it exists to keep casual visitors out of a public
 * GitHub Pages URL, not to protect anything sensitive. Correct code is
 * persisted to localStorage (accessStorage.ts) so a device only ever enters
 * it once; the session-scoped intro flag underneath is untouched and keeps
 * governing what happens next.
 */
export function AccessGate({ onAuthorized }: AccessGateProps) {
  const [code, setCode] = useState('');
  const [denied, setDenied] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      grantAccess();
      onAuthorized();
      return;
    }
    setDenied(true);
    setCode('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mission-void/70 px-4 animate-[intro-quickfade_0.5s_ease-out_both]">
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 border border-gold/25 bg-mission-void/80 px-8 py-12 text-center shadow-gold-lg backdrop-blur-sm">
        <span className="flex h-14 w-14 items-center justify-center border border-gold/50 text-gold" aria-hidden>
          <Lock size={26} />
        </span>

        <div className="space-y-1.5">
          <p className="font-display text-2xl font-bold tracking-[0.14em] text-ink">007</p>
          <p className="font-display text-xl font-bold uppercase leading-tight tracking-[0.08em] text-gold-gradient bg-gold-sweep bg-[length:200%_auto] bg-clip-text text-transparent">
            Classified Access
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold/80">Team Zwolle</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <label htmlFor="access-code" className="block font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
            Enter Access Code
          </label>
          <input
            id="access-code"
            type="password"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (denied) setDenied(false);
            }}
            className="w-full border border-white/15 bg-mission-raised px-4 py-3.5 text-center text-base text-ink tracking-[0.2em] placeholder:text-ink-muted/50 transition-colors focus:border-gold focus:outline-none [color-scheme:dark]"
            placeholder="••••••"
            autoFocus
          />
          <button
            type="submit"
            className="mt-2 w-full border border-gold bg-gold/10 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.24em] text-gold shadow-gold transition-colors duration-150 hover:bg-gold/20"
          >
            Authorize
          </button>
        </form>

        <p
          role="status"
          aria-live="polite"
          className={`flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400 transition-opacity duration-200 ${
            denied ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <ShieldAlert size={13} aria-hidden />
          Access Denied
        </p>

        <p className="text-[10px] uppercase tracking-[0.3em] text-ink-dim">Authorized Personnel Only</p>
      </div>
    </div>
  );
}
