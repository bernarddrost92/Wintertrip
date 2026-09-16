import { useState } from 'react';
import { GoldButton } from '../../components/GoldButton';
import { FormField, TextInput } from '../../components/FormField';
import { useMissionHuntAuth } from './missionHuntAuthContext';

/**
 * Mission Hunt's own sign-in, layered on top of the app's existing Access
 * Gate: invite-only email magic link, no password, no dropdown of names to
 * pick from (spec section 5 — nobody can just claim to be Bernard).
 */
export function AuthGate() {
  const { status, requestMagicLink } = useMissionHuntAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const result = await requestMagicLink(email.trim());
    setSending(false);
    if (!result.ok) setError(result.error);
  }

  if (status === 'awaiting_magic_link') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="label-classified text-gold/70">Mission Hunt · Login</p>
        <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-ink">Check je e-mail</h1>
        <p className="mt-3 text-sm text-ink-muted">
          We hebben een inloglink gestuurd naar <span className="text-ink">{email}</span>. Open die link op dit apparaat om verder te gaan.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="label-classified text-center text-gold/70">Mission Hunt · Login</p>
      <h1 className="mt-4 text-center font-display text-2xl font-bold uppercase tracking-wide text-ink">Agent Login</h1>
      <p className="mt-3 text-center text-sm text-ink-muted">Alleen voor uitgenodigde Team Zwolle-leden. Log in met je e-mailadres.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        <FormField id="mh-login-email" label="E-mailadres">
          <TextInput id="mh-login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@team-zwolle.nl" />
        </FormField>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <GoldButton type="submit" disabled={sending || !email.trim()}>
          {sending ? 'Versturen…' : 'Stuur inloglink'}
        </GoldButton>
      </form>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Eerste keer op dit apparaat? Je ontvangt een inloglink per mail. Daarna onthouden we je login op dit apparaat.
      </p>
    </div>
  );
}
