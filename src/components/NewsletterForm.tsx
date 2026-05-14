"use client";

import { useState } from "react";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        setState("ok");
        setMessage("You're in. Check your inbox for a confirmation.");
        setEmail("");
      } else {
        setState("error");
        setMessage(json.error || "Couldn't subscribe. Try again.");
      }
    } catch {
      setState("error");
      setMessage("Network error. Try again in a moment.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 w-full">
      <div className="flex gap-2 w-full">
        <input
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          required
          className="flex-1 min-w-0 bg-ink-soft border border-edge rounded-btn px-3 py-2 text-sm placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent/60"
        />
        <button
          type="submit"
          disabled={state === "loading" || !email.trim()}
          className="inline-flex items-center justify-center px-3 py-2 rounded-btn bg-accent text-ink-soft text-sm font-semibold disabled:opacity-50 hover:bg-accent/90 transition-colors"
        >
          {state === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {message ? (
        <div
          className={`text-xs ${state === "ok" ? "text-accent" : "text-accent-danger"}`}
        >
          {message}
        </div>
      ) : (
        <div className="text-[11px] text-text-faint">
          Weekly digest. Unsubscribe with one click.
        </div>
      )}
    </form>
  );
}
