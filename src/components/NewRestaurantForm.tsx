"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/client";

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export function NewRestaurantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState("");
  const [avgTurnMinutes, setAvg] = useState(45);
  const [tables, setTables] = useState([
    { label: "T1", seats: 2 },
    { label: "T2", seats: 2 },
    { label: "T3", seats: 4 },
    { label: "T4", seats: 4 },
  ]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const finalSlug = slugEdited ? slug : toSlug(name);
  const updateTable = (i: number, patch: Partial<{ label: string; seats: number }>) =>
    setTables((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await postJson<{ slug: string }>("/api/restaurants", {
      name,
      slug: finalSlug,
      address,
      pin,
      avgTurnMinutes,
      tables,
    });
    if (!data) {
      setError(error);
      setBusy(false);
      return;
    }
    router.push(`/host/${data.slug}`);
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Add your restaurant</h1>
      <label className="block">
        <span className="mb-1 block text-sm text-stone-600">Restaurant name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-stone-600">Link name (your guest page will be /r/{finalSlug || "…"})</span>
        <input
          className="input"
          value={finalSlug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(toSlug(e.target.value));
          }}
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-stone-600">Address (optional)</span>
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={120} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-stone-600">Host PIN (4 to 8 digits)</span>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            pattern="\d{4,8}"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-stone-600">Avg. table time (min)</span>
          <input
            className="input"
            type="number"
            min={5}
            max={240}
            value={avgTurnMinutes}
            onChange={(e) => setAvg(Number(e.target.value))}
          />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm text-stone-600">Tables</legend>
        {tables.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input"
              value={t.label}
              onChange={(e) => updateTable(i, { label: e.target.value })}
              aria-label="Table name"
              required
              maxLength={20}
            />
            <input
              className="input w-24"
              type="number"
              min={1}
              max={30}
              value={t.seats}
              onChange={(e) => updateTable(i, { seats: Number(e.target.value) })}
              aria-label="Seats"
            />
            <span className="text-sm text-stone-500">seats</span>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setTables((ts) => ts.filter((_, j) => j !== i))}
              disabled={tables.length === 1}
              aria-label="Remove table"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setTables((ts) => [...ts, { label: `T${ts.length + 1}`, seats: 4 }])}
        >
          + Add table
        </button>
      </fieldset>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn-primary w-full py-3" disabled={busy}>
        {busy ? "Creating…" : "Create and open dashboard"}
      </button>
    </form>
  );
}
