"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Enter the admin password to access the dashboard.");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("Signing in...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed.");

      router.push(searchParams.get("next") || "/admin");
      router.refresh();
    } catch (error: any) {
      setStatus(error.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authWrap">
      <form className="authCard" onSubmit={onSubmit}>
        <span className="eyebrow">Admin access</span>
        <h1>Equipment app login</h1>
        <p className="muted">Use the password stored in the ADMIN_PASSWORD environment variable.</p>
        <div className="field">
          <label>Admin password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
        </div>
        <div className="actions">
          <button className="button" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <a className="button secondary" href="/">
            Back to scanner
          </a>
        </div>
        <div className="status small">{status}</div>
      </form>
    </main>
  );
}
