"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson, savedToken } from "@/lib/client";

/** Name + party size form. On success, takes the guest to their live "place in line" page. */
export function JoinForm({
  slug,
  maxPartySize,
  size,
  onSizeChange,
}: {
  slug: string;
  maxPartySize: number;
  size: number;
  onSizeChange: (size: number) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const { data, error } = await postJson<{ token: string }>(`/api/r/${slug}/join`, { name, size, phone });
    if (!data) {
      setError(error);
      setBusy(false);
      return;
    }
    savedToken.set(slug, data.token);
    router.push(`/r/${slug}/wait/${data.token}`);
  }

  const sizes = Array.from({ length: Math.max(maxPartySize, 1) }, (_, i) => i + 1);

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="text-lg font-semibold">Join the waitlist</h2>
      <label className="block">
        <span className="mb-1 block text-sm text-stone-600">Your name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
      </label>
      <div>
        <span className="mb-1 block text-sm text-stone-600">Party size</span>
        <div className="flex flex-wrap gap-2">
          {sizes.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onSizeChange(n)}
              className={`h-10 w-10 rounded-lg border text-sm font-medium ${
                n === size ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white hover:bg-stone-100"
              }`}
              aria-pressed={n === size}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-stone-600">Phone (optional, so the host can call you)</span>
        <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn-primary w-full py-3 text-base" disabled={busy || !name.trim()}>
        {busy ? "Joining…" : "Join the line"}
      </button>
    </form>
  );
}
