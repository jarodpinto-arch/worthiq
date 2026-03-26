"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthBrandScreen } from "../../components/Auth/AuthBrandScreen";
import { getApiBase } from "../../lib/api-base";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      localStorage.setItem("authToken", data.access_token);
      router.push("/connect");
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
      subtitle="Create your WorthIQ account"
    >
      <div className="relative z-[1] space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="signup-name"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Name <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-email"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            className={inputClass}
          />
        </div>

        {error ? (
          <p className="text-center text-sm text-red-400">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={handleSignup}
          disabled={loading}
          className="btn-on-dark-primary btn-on-dark-primary--offset-panel"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="border-t border-slate-600/40 pt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-worthiq-cyan transition-colors hover:text-white"
          >
            Sign in
          </a>
        </p>
      </div>
    </AuthBrandScreen>
  );
}
