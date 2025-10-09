import Navbar from '../components/Navbar';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import getSupabase, { signInWithEmailOtp } from '../lib/supabase';
import { backendLoginWithSupabase } from '../hooks/useAuth';
import Button from '../components/ui/Button';

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = router.query as { email?: string };
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // If already signed in via supabase (magic link), exchange token and redirect
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(async (r) => {
      const session = r.data.session;
      if (session?.access_token) {
        try {
          await backendLoginWithSupabase(session.access_token);
        } catch (e) {
          // ignore
        }
        router.push('/dashboard');
      }
    });

    // fetch link status for UX
    if (email) {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/link-status?email=${encodeURIComponent(String(email))}`);
        if (resp.ok) {
          const json = await resp.json();
          if (json.lastSent) setStatus((s) => s); // keep status but store lastSent in state below
          // store lastSent in local state via a small hack
          (window as any).__lastSent = json.lastSent;
          (window as any).__attemptsToday = json.attemptsToday;
        }
      } catch {}
    }
  }, [router, email]);

  async function onResend() {
    if (!email) return setStatus('No email provided');
    setResending(true);
    setStatus(null);
    try {
      // ask backend if allowed
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await resp.json();
      if (!json.ok) {
        setStatus(json.message || 'Rate limit');
        return;
      }
      await signInWithEmailOtp(email);
      setStatus('Magic link sent — check your inbox');
    } catch (err: any) {
      setStatus(err?.message || 'Error sending email');
    } finally {
      setResending(false);
    }
  }

  async function onCheck() {
    setChecking(true);
    setStatus(null);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase not available');
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.access_token) {
        await backendLoginWithSupabase(session.access_token);
        router.push('/dashboard');
        return;
      }

      // check if last sent is older than 24 hours
      const lastSent = (window as any).__lastSent as string | undefined;
      if (lastSent) {
        const diff = Date.now() - new Date(lastSent).getTime();
        if (diff > 24 * 60 * 60 * 1000) {
          setStatus('Link expired — request a new one');
          return;
        }
      }

      setStatus('Not verified yet — check your email and click the link.');
    } catch (err: any) {
      setStatus(err?.message || 'Error checking session');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-20 max-w-xl mx-auto text-center">
        <div className="card-surface p-8">
          <h2 className="text-2xl font-bold mb-2">Verify your email</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We sent a magic sign-in link to <strong>{email}</strong>. Click the link to verify your
            address and sign in.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onResend} disabled={resending}>
              {resending ? 'Resending…' : 'Resend email'}
            </Button>
            <Button onClick={onCheck} variant="secondary" disabled={checking}>
              {checking ? 'Checking…' : 'I clicked the link'}
            </Button>
          </div>
          {status && <div className="mt-4 text-sm text-primary">{status}</div>}
        </div>
      </main>
    </div>
  );
}
