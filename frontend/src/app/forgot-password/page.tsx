"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0C10] p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter text-white">WorthIQ</h1>
          <p className="text-blue-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Password Reset</p>
        </div>

        {submitted ? (
          <div className="bg-[#11141B] border border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <p className="text-green-400 font-bold">Check your email</p>
            <p className="text-slate-400 text-sm">
              If an account exists for <span className="text-white">{email}</span>, you'll receive a reset link shortly.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="text-blue-500 text-sm font-bold hover:text-blue-400"
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
              className="w-full p-4 bg-[#11141B] border border-slate-800 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || !email}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
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
