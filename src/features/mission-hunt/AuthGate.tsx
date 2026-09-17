import { useState, type ChangeEvent, type FormEvent } from 'react';
import { GoldButton } from '../../components/GoldButton';
import { FormField, TextInput } from '../../components/FormField';
import { useMissionHuntAuth } from './missionHuntAuthContext';

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function sanitizeOtpInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 6);
}

/**
 * Mission Hunt's own sign-in, layered on top of the app's existing Access
 * Gate: invite-only, no password, no dropdown of names to pick from (spec
 * section 5 — nobody can just claim to be Bernard).
 *
 * Two steps: request a 6-digit code by email, then type it back in here —
 * never a clickable link (see MissionHuntAuthProvider for why).
 */
export function AuthGate() {
  const { status, requestOtp, verifyOtp, returnToEmailStep } = useMissionHuntAuth();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeEmail(email);
    if (!normalized || sending) return;
    setSending(true);
    setError(null);
    const result = await requestOtp(normalized);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSentTo(normalized);
  }

  async function handleResend() {
    if (resending || sending || !sentTo) return;
    setResending(true);
    setError(null);
    const result = await requestOtp(sentTo);
    setResending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCode('');
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6 || verifying) return;
    setVerifying(true);
    setError(null);
    const result = await verifyOtp(sentTo, code);
    setVerifying(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Signed in — MissionHuntAuthProvider's auth-state listener takes it
    // from here, this component is about to unmount in favour of the
    // dashboard.
  }

  function handleChangeEmail() {
    setCode('');
    setError(null);
    setSentTo('');
    returnToEmailStep();
  }

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    setCode(sanitizeOtpInput(event.target.value));
  }

  if (status === 'awaiting_otp') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="label-classified text-center text-gold/70">Mission Hunt · Login</p>
        <h1 className="mt-4 text-center font-display text-2xl font-bold uppercase tracking-wide text-ink">Controlecode</h1>
        <p className="mt-3 text-center text-sm text-ink-muted">
          We hebben een code gestuurd naar: <span className="text-ink">{sentTo}</span>
        </p>

        <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-3">
          <FormField id="mh-otp-code" label="Controlecode">
            <TextInput
              id="mh-otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="______"
              autoFocus
              className="text-center text-lg tracking-[0.5em]"
            />
          </FormField>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <GoldButton type="submit" disabled={verifying || code.length !== 6}>
            {verifying ? 'Bezig…' : 'Inloggen'}
          </GoldButton>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-center text-xs text-ink-muted">Geen code ontvangen?</p>
          <GoldButton type="button" variant="ghost" onClick={handleResend} disabled={resending || sending}>
            {resending ? 'Versturen…' : 'Stuur nieuwe code'}
          </GoldButton>
          <GoldButton type="button" variant="subtle" onClick={handleChangeEmail} className="mt-1">
            Ander e-mailadres
          </GoldButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="label-classified text-center text-gold/70">Mission Hunt · Login</p>
      <h1 className="mt-4 text-center font-display text-2xl font-bold uppercase tracking-wide text-ink">Agent Login</h1>
      <p className="mt-3 text-center text-sm text-ink-muted">Alleen voor uitgenodigde Team Zwolle-leden. Log in met je e-mailadres.</p>

      <form onSubmit={handleRequestCode} className="mt-8 flex flex-col gap-3">
        <FormField id="mh-login-email" label="E-mailadres">
          <TextInput id="mh-login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@maandag.com" />
        </FormField>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <GoldButton type="submit" disabled={sending || !email.trim()}>
          {sending ? 'Versturen…' : 'Stuur inlogcode'}
        </GoldButton>
      </form>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Eerste keer op dit apparaat? Je ontvangt een 6-cijferige code per mail. Na het inloggen onthouden we je op dit apparaat.
      </p>
    </div>
  );
}
