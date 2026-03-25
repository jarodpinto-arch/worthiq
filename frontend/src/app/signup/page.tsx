"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0C10] p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter text-white">Join WorthIQ™</h1>
          <p className="text-blue-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Create your account</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-4 bg-[#11141B] border border-slate-800 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-4 bg-[#11141B] border border-slate-800 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
          />
          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignup()}
            className="w-full p-4 bg-[#11141B] border border-slate-800 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-slate-500 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-blue-500 font-bold hover:text-blue-400">Sign in</a>
        </p>
      </div>
    </div>
  );
}
