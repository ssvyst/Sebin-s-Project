"use client";

import { useState } from "react";
import type { HostTable } from "@/lib/types";

type Act = (path: "tables", body: Record<string, string | number>) => Promise<boolean>;

/** The host's table tiles: tap to switch between free and taken. */
export function TableGrid({ tables, act }: { tables: HostTable[]; act: Act }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState("");
  const [seats, setSeats] = useState(4);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (await act("tables", { action: "add", label, seats })) setLabel("");
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {tables.map((t) => {
          const free = t.status === "FREE";
          return (
            <div key={t.id} className="relative">
              <button
                onClick={() => act("tables", { action: "set", tableId: t.id, status: free ? "OCCUPIED" : "FREE" })}
                className={`w-full rounded-xl border-2 p-3 text-left transition ${
                  free
                    ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                    : "border-rose-300 bg-rose-50 hover:bg-rose-100"
                }`}
                aria-label={`${t.label}, ${t.seats} seats, ${free ? "free. Tap to mark taken" : "taken. Tap to mark free"}`}
              >
                <div className="font-semibold">{t.label}</div>
                <div className="text-xs text-stone-600">{t.seats} seats</div>
                <div className={`mt-1 text-xs font-semibold ${free ? "text-emerald-700" : "text-rose-700"}`}>
                  {free ? "FREE" : `Taken · ${t.occupiedMinutes ?? 0} min`}
                </div>
              </button>
              {editing && (
                <button
                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-600 text-xs text-white"
                  onClick={() => confirm(`Delete table ${t.label}?`) && act("tables", { action: "remove", tableId: t.id })}
                  aria-label={`Delete table ${t.label}`}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-ghost" onClick={() => setEditing((v) => !v)}>
          {editing ? "Done editing" : "Edit tables"}
        </button>
        {editing && (
          <form onSubmit={add} className="flex flex-wrap items-center gap-2">
            <input
              className="input w-28"
              placeholder="Name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={20}
              required
            />
            <input
              className="input w-20"
              type="number"
              min={1}
              max={30}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              aria-label="Seats"
            />
            <button className="btn-primary">Add table</button>
          </form>
        )}
      </div>
    </div>
  );
}
