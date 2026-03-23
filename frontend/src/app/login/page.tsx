"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid email or password.');
        return;
      }

      localStorage.setItem('authToken', data.access_token);
      router.push('/dashboard');
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
          <p className="text-blue-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">"See the Risk. Own the Reward."</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full p-4 bg-[#11141B] border border-slate-800 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full p-4 bg-[#11141B] border border-slate-800 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <div className="text-center space-y-2">
          <p className="text-slate-500 text-sm">
            <a href="/forgot-password" className="text-slate-400 hover:text-blue-400 transition-colors">Forgot password?</a>
          </p>
          <p className="text-slate-500 text-sm">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-500 font-bold hover:text-blue-400">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
