"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin";
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        action="/api/login"
        method="POST"
        className="w-full max-w-sm rounded-2xl border p-6 space-y-4 bg-white"
      >
        <h1 className="text-xl font-semibold">Admin Login</h1>

        <input type="hidden" name="next" value={nextUrl} />

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black text-white py-2"
        >
          Sign In
        </button>
      </form>
    </main>
  );
}
