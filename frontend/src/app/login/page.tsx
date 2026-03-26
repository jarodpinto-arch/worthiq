"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthBrandScreen } from "../../components/Auth/AuthBrandScreen";
import { getApiBase } from "../../lib/api-base";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      localStorage.setItem("authToken", data.access_token);
      router.push("/dashboard");
    } catch {
      setError("Could not connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-700/80 bg-black/40 px-4 py-3.5 text-[15px] text-white outline-none transition placeholder:text-slate-600 focus:border-worthiq-cyan/40 focus:ring-2 focus:ring-worthiq-cyan/30";

  return (
    <AuthBrandScreen
      tagline="See the Risk. Own the Reward."
      subtitle="Sign in to your dashboard"
    >
      <div className="relative z-[1] space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className={inputClass}
          />
        </div>

        {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-xl bg-worthiq-cyan py-3.5 text-[15px] font-bold text-black shadow-lg shadow-worthiq-cyan/20 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="space-y-3 border-t border-slate-800/80 pt-6 text-center text-sm text-slate-500">
          <p>
            <a href="/forgot-password" className="text-slate-400 transition-colors hover:text-worthiq-cyan">
              Forgot password?
            </a>
          </p>
          <p>
            Don&apos;t have an account?{" "}
            <a href="/signup" className="font-semibold text-worthiq-cyan transition-colors hover:text-white">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </AuthBrandScreen>
  );
}
