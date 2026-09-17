import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AccessGate } from './AccessGate';

const { isSupabaseConfigured, getSupabaseClient, signInWithPassword } = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  getSupabaseClient: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured, getSupabaseClient }));

describe('AccessGate', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue({ auth: { signInWithPassword } });
    signInWithPassword.mockReset();
  });

  it('shows the shared password screen — no technical email visible anywhere', () => {
    render(<AccessGate />);
    expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter mission/i })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/teamzwolle@wintertrip\.internal/i);
    expect(document.body.textContent?.toLowerCase()).not.toContain('supabase');
  });

  it('a correct password calls signInWithPassword with the fixed technical email — never asking the user for one', async () => {
    signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null });
    const user = userEvent.setup();
    render(<AccessGate />);

    await user.type(screen.getByLabelText(/wachtwoord/i), 'the-real-shared-password{Enter}');

    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledWith({ email: 'teamzwolle@wintertrip.internal', password: 'the-real-shared-password' }));
  });

  it('shows a loading state while the sign-in request is in flight', async () => {
    let resolveSignIn: (v: { data: { session: null }; error: null }) => void = () => {};
    signInWithPassword.mockReturnValue(new Promise((resolve) => { resolveSignIn = resolve; }));
    const user = userEvent.setup();
    render(<AccessGate />);

    await user.type(screen.getByLabelText(/wachtwoord/i), 'anything{Enter}');

    expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled();

    resolveSignIn({ data: { session: null }, error: null });
  });

  it('a wrong password shows TOEGANG GEWEIGERD and clears the field — never exposing the raw Supabase error', async () => {
    signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials', status: 400 } });
    const user = userEvent.setup();
    render(<AccessGate />);

    await user.type(screen.getByLabelText(/wachtwoord/i), 'wrong-password{Enter}');

    expect(await screen.findByText(/toegang geweigerd/i)).toBeInTheDocument();
    expect(screen.getByText(/controleer het wachtwoord/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wachtwoord/i)).toHaveValue('');
    expect(document.body.textContent).not.toMatch(/invalid login credentials/i);
  });

  it('a network/other failure shows VERBINDING MISLUKT, distinct from a wrong password', async () => {
    signInWithPassword.mockRejectedValue(new Error('fetch failed'));
    const user = userEvent.setup();
    render(<AccessGate />);

    await user.type(screen.getByLabelText(/wachtwoord/i), 'anything{Enter}');

    expect(await screen.findByText(/verbinding mislukt/i)).toBeInTheDocument();
    expect(screen.queryByText(/toegang geweigerd/i)).not.toBeInTheDocument();
  });

  it('typing again after a denial clears the error state', async () => {
    signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials' } });
    const user = userEvent.setup();
    render(<AccessGate />);

    await user.type(screen.getByLabelText(/wachtwoord/i), 'wrong{Enter}');
    expect(await screen.findByText(/toegang geweigerd/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/wachtwoord/i), 'x');
    expect(screen.queryByText(/toegang geweigerd/i)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('opacity-0');
  });

  it('the password field is masked', () => {
    render(<AccessGate />);
    expect(screen.getByLabelText(/wachtwoord/i)).toHaveAttribute('type', 'password');
  });
});
