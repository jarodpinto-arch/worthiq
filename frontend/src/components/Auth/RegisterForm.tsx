import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WorthIQLogo } from '../WorthIQLogo';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const { register, error, clearError, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password || !confirmPassword) {
      setLocalError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    try {
      await register(email, password, name || undefined);
    } catch (err) {
      // Error is already handled by AuthContext
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-worthiq-surface px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <WorthIQLogo className="w-40" priority />
          <h2 className="mt-6 text-2xl font-bold text-white">Create your account</h2>
          <p className="mt-2 text-sm text-slate-500">Start managing your finances today</p>
        </div>

        <form className="space-y-6 rounded-2xl border border-slate-800 bg-worthiq-panel p-8 shadow-xl" onSubmit={handleSubmit}>
          {displayError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {displayError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-400">
                Full name <span className="text-slate-600">(optional)</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="relative block w-full appearance-none rounded-xl border border-slate-700 bg-black/30 px-4 py-3 text-white placeholder:text-slate-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-worthiq-cyan"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-400">
                Email address <span className="text-worthiq-bear">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full appearance-none rounded-xl border border-slate-700 bg-black/30 px-4 py-3 text-white placeholder:text-slate-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-worthiq-cyan"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-400">
                Password <span className="text-worthiq-bear">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full appearance-none rounded-xl border border-slate-700 bg-black/30 px-4 py-3 text-white placeholder:text-slate-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-worthiq-cyan"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-400">
                Confirm password <span className="text-worthiq-bear">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="relative block w-full appearance-none rounded-xl border border-slate-700 bg-black/30 px-4 py-3 text-white placeholder:text-slate-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-worthiq-cyan"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-worthiq-cyan px-4 py-3 text-sm font-bold text-black transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-worthiq-cyan focus:ring-offset-2 focus:ring-offset-worthiq-panel disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="font-semibold text-worthiq-cyan transition-colors hover:text-white"
              >
                Sign in instead
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
