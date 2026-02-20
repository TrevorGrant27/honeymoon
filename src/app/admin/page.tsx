"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      setError("Invalid password");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">🔐</span>
          <h1 className="font-display font-bold text-3xl text-dark-brown">
            Admin Access
          </h1>
          <p className="text-warm-brown mt-2">
            Enter the password to manage your registry.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-[20px] border-2 border-border p-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-cream border-2 border-border text-dark-brown focus:border-coral focus:outline-none transition-colors mb-4"
            />

            {error && (
              <p className="text-red-600 text-sm text-center mb-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full py-3 rounded-[14px] bg-gradient-to-r from-coral to-deep-coral text-white font-semibold disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        <p className="text-center mt-6">
          <a href="/" className="text-warm-brown hover:text-coral text-sm">
            &larr; Back to registry
          </a>
        </p>
      </div>
    </main>
  );
}
