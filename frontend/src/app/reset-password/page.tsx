"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      const res = await fetch(`${API_URL}/auth/reset-password`, {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0C10] p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter text-white">WorthIQ</h1>
          <p className="text-blue-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Set New Password</p>
        </div>

        {success ? (
          <div className="bg-[#11141B] border border-slate-800 rounded-2xl p-6 text-center space-y-3">
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
              className="w-full p-4 bg-[#11141B] border border-slate-800 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              className="w-full p-4 bg-[#11141B] border border-slate-800 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              onClick={handleReset}
              disabled={loading || !token || !password || !confirm}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
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
