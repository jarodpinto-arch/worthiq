"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorthIQLogoNav } from '../../components/WorthIQLogoNav';
import { getApiBase } from '../../lib/api-base';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Something went wrong.');
        return;
      }

      setSubmitted(true);
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
          <WorthIQLogoNav className="w-48 sm:w-56" priority />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-worthiq-cyan">Password reset</p>
        </div>

        {submitted ? (
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-worthiq-panel p-6 text-center">
            <p className="text-green-400 font-bold">Check your email</p>
            <p className="text-slate-400 text-sm">
              If an account exists for <span className="text-white">{email}</span>, you'll receive a reset link shortly.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="text-sm font-bold text-worthiq-cyan hover:text-white"
            >
              ← Back to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm text-center">
              Enter your email and we'll send you a reset link.
            </p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="input-auth w-full rounded-2xl py-4"
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || !email}
              className="btn-on-dark-primary btn-on-dark-primary--offset-surface"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              onClick={() => router.push('/login')}
              className="w-full text-slate-500 text-sm hover:text-slate-300 transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
