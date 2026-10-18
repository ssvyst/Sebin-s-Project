"use client";

import { useState } from "react";
import type { HostParty, HostTable } from "@/lib/types";

type Act = (path: "parties", body: Record<string, string>) => Promise<boolean>;

/** The host's list of waiting parties, with Notify / Seat / Remove buttons. */
export function QueueList({ parties, tables, act }: { parties: HostParty[]; tables: HostTable[]; act: Act }) {
  if (!parties.length) {
    return <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-stone-500">Nobody waiting.</p>;
  }
  return (
    <ol className="space-y-2">
      {parties.map((p, i) => (
        <PartyRow key={p.id} party={p} position={i + 1} tables={tables} act={act} />
      ))}
    </ol>
  );
}

function PartyRow({ party, position, tables, act }: { party: HostParty; position: number; tables: HostTable[]; act: Act }) {
  // Free tables that fit, smallest first so big tables stay open.
  const fits = tables.filter((t) => t.status === "FREE" && t.seats >= party.size).sort((a, b) => a.seats - b.seats);
  const [tableId, setTableId] = useState("");
  const [busy, setBusy] = useState(false);
  const chosen = fits.some((t) => t.id === tableId) ? tableId : fits[0]?.id ?? "";

  const run = async (body: Record<string, string>) => {
    setBusy(true);
    await act("parties", { partyId: party.id, ...body });
    setBusy(false);
  };

  return (
    <li
      className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
        party.status === "NOTIFIED" ? "border-emerald-300 bg-emerald-50" : "border-stone-200 bg-white"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
        {position}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">
          {party.name} <span className="text-stone-500">· party of {party.size}</span>
        </div>
        <div className="text-xs text-stone-500">
          Waited {party.waitedMinutes} min
          {party.etaMinutes !== null && ` · est. table in ${party.etaMinutes} min`}
          {party.phone && ` · ${party.phone}`}
          {party.status === "NOTIFIED" && <span className="font-semibold text-emerald-700"> · Notified</span>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-ghost" disabled={busy} onClick={() => run({ action: "notify" })}>
          {party.status === "NOTIFIED" ? "Notify again" : "Notify"}
        </button>
        {fits.length ? (
          <>
            <select
              className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm"
              value={chosen}
              onChange={(e) => setTableId(e.target.value)}
              aria-label={`Table for ${party.name}`}
            >
              {fits.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.seats})
                </option>
              ))}
            </select>
            <button className="btn-primary" disabled={busy} onClick={() => run({ action: "seat", tableId: chosen })}>
              Seat
            </button>
          </>
        ) : (
          <span className="text-xs text-stone-500">No free table fits</span>
        )}
        <button
          className="btn-danger"
          disabled={busy}
          onClick={() => confirm(`Remove ${party.name} from the line?`) && run({ action: "remove" })}
        >
          Remove
        </button>
      </div>
    </li>
  );
}
