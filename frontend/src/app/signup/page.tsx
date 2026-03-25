"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorthIQLogo } from '../../components/WorthIQLogo';
import { getApiBase } from '../../lib/api-base';

const API_URL = getApiBase();

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed.');
        return;
      }

      localStorage.setItem('authToken', data.access_token);
      router.push('/connect');
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
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-worthiq-cyan">
            Create your account
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-worthiq-panel p-4 text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-worthiq-cyan"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-worthiq-panel p-4 text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-worthiq-cyan"
          />
          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignup()}
            className="w-full rounded-2xl border border-slate-800 bg-worthiq-panel p-4 text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-worthiq-cyan"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full rounded-2xl bg-worthiq-cyan py-4 font-bold text-black transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-slate-500 text-sm">
          Already have an account?{' '}
          <a href="/login" className="font-bold text-worthiq-cyan hover:text-white">Sign in</a>
        </p>
      </div>
    </div>
  );
}
