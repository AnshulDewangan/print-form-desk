'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabaseBrowser } from '@/lib/supabase-browser';
export default function AuthPanel({ onChange }: { onChange?: () => void }) {
  const [email, setEmail] = useState(''),
    [message, setMessage] = useState(''),
    [user, setUser] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const [client, setClient] =
    useState<Awaited<ReturnType<typeof supabaseBrowser>>>(null);
  useEffect(() => {
    let cleanup = () => {};
    void supabaseBrowser().then((auth) => {
      setClient(auth);
      if (!auth) return;
      auth.auth.getUser().then(({ data }) => setUser(data.user?.email ?? null));
      const { data } = auth.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user?.email ?? null);
        onChange?.();
      });
      cleanup = () => data.subscription.unsubscribe();
    });
    return () => cleanup();
  }, [onChange]);
  if (!client)
    return (
      <p className="paid-small">
        Public sign-in is not connected yet. The owner must add Supabase
        settings before account features can be used.
      </p>
    );
  const auth = client;
  async function google() {
    setBusy(true);
    const { error } = await auth.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/?workspace=plans' },
    });
    if (error) setMessage(error.message);
    setBusy(false);
  }
  async function magicLink() {
    setBusy(true);
    const clean = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      setMessage('Enter a valid email address.');
      setBusy(false);
      return;
    }
    const { error } = await auth.auth.signInWithOtp({
      email: clean,
      options: {
        emailRedirectTo: window.location.origin + '/?workspace=plans',
      },
    });
    setMessage(
      error ? error.message : 'Check your email for a secure sign-in link.',
    );
    setBusy(false);
  }
  async function signOut() {
    setBusy(true);
    await auth.auth.signOut();
    setMessage('Signed out.');
    setBusy(false);
    onChange?.();
  }
  if (user)
    return (
      <p className="paid-small">
        Signed in as {user} ·{' '}
        <button
          className="paid-link"
          type="button"
          onClick={signOut}
          disabled={busy}
        >
          Sign out
        </button>
      </p>
    );
  return (
    <div className="auth-panel">
      <Button type="button" variant="outline" disabled={busy} onClick={google}>
        Continue with Google
      </Button>
      <div className="auth-divider">or use email</div>
      <div className="paid-actions">
        <Input
          type="email"
          placeholder="you@example.com"
          aria-label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="button" disabled={busy} onClick={magicLink}>
          Email me a sign-in link
        </Button>
      </div>
      {message && (
        <p className="paid-notice" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
