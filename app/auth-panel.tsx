'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabaseBrowser, hasGoogleSignIn } from '@/lib/supabase-browser';
export default function AuthPanel({ onChange }: { onChange?: () => void }) {
  const [email, setEmail] = useState(''),
    [message, setMessage] = useState(''),
    [user, setUser] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const [client, setClient] =
    useState<Awaited<ReturnType<typeof supabaseBrowser>>>(null);
  const [loading, setLoading] = useState(true);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cleanup = () => {};
    void supabaseBrowser().then((auth) => {
      if (disposed) return;
      setClient(auth);
      setLoading(false);
      if (!auth) return;
      const { data } = auth.auth.onAuthStateChange((_event, session) => {
        if (disposed) return;
        setUser(session?.user?.email ?? null);
        // Leave the Supabase auth lock before refreshing account data.
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (!disposed) onChangeRef.current?.();
        }, 0);
      });
      cleanup = () => data.subscription.unsubscribe();
    });
    return () => {
      disposed = true;
      clearTimeout(timer);
      cleanup();
    };
  }, []);
  if (loading)
    return (
      <p className="paid-small" role="status">
        Loading sign-in…
      </p>
    );
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
    setMessage('');
    try {
      const { error } = await auth.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/?workspace=plans' },
      });
      if (error) setMessage(error.message);
    } catch {
      setMessage('Could not reach sign-in. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function magicLink() {
    setBusy(true);
    const clean = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      setMessage('Enter a valid email address.');
      setBusy(false);
      return;
    }
    try {
      const { error } = await auth.auth.signInWithOtp({
        email: clean,
        options: {
          emailRedirectTo: window.location.origin + '/?workspace=plans',
        },
      });
      setMessage(
        error ? error.message : 'Check your email for a secure sign-in link.',
      );
    } catch {
      setMessage('Could not send the sign-in link. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      const { error } = await auth.auth.signOut();
      if (error) setMessage(error.message);
      else setMessage('Signed out.');
    } catch {
      setMessage('Could not sign out. Please try again.');
    } finally {
      setBusy(false);
    }
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
      {hasGoogleSignIn() && (
        <>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={google}
          >
            Continue with Google
          </Button>
          <div className="auth-divider">or use email</div>
        </>
      )}
      <p className="paid-small">
        Sign in or create an account with a secure email link. No password
        needed.
      </p>
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
