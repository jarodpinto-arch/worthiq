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

  const inputClass = "input-auth w-full";

  return (
    <AuthBrandScreen
      tagline="See the Risk. Own the Reward."
      subtitle="Sign in to your dashboard"
    >
      <div className="relative z-[1] space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
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
          <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
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
          className="btn-on-dark-primary btn-on-dark-primary--offset-panel"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="space-y-3 border-t border-slate-600/40 pt-6 text-center text-sm text-slate-400">
          <p>
            <a href="/forgot-password" className="font-medium text-slate-300 transition-colors hover:text-worthiq-cyan">
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
