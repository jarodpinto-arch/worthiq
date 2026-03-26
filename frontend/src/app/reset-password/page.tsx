"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorthIQLogo } from '../../components/WorthIQLogo';
import { getApiBase } from '../../lib/api-base';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
    }
  }, [token]);

  const handleReset = async () => {
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Reset failed. The link may have expired.');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-worthiq-surface p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <WorthIQLogo className="w-44" priority />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-worthiq-cyan">Set new password</p>
        </div>

        {success ? (
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-worthiq-panel p-6 text-center">
            <p className="text-green-400 font-bold">Password updated!</p>
            <p className="text-slate-400 text-sm">Redirecting you to sign in...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="New password (min 8 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-worthiq-panel p-4 text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-worthiq-cyan"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              className="w-full rounded-2xl border border-slate-800 bg-worthiq-panel p-4 text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-worthiq-cyan"
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              onClick={handleReset}
              disabled={loading || !token || !password || !confirm}
              className="w-full rounded-2xl bg-worthiq-cyan py-4 font-bold text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
