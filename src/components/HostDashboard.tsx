"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLiveBoard } from "@/hooks/useLiveBoard";
import { postJson } from "@/lib/client";
import { BoardStatus } from "./BoardStatus";
import { LiveDot } from "./LiveDot";
import { QueueList } from "./QueueList";
import { TableGrid } from "./TableGrid";

export function HostDashboard({ slug }: { slug: string }) {
  const router = useRouter();
  const { board, host, connected } = useLiveBoard(slug);
  const [error, setError] = useState<string>();

  // Every action just posts; the live stream brings back the new state.
  const act = useCallback(
    async (path: string, body: Record<string, string | number>) => {
      const { error } = await postJson(`/api/host/${slug}/${path}`, body);
      setError(error);
      if (error?.includes("log in")) router.push(`/host/${slug}/login`);
      return !error;
    },
    [slug, router],
  );

  async function logout() {
    await postJson(`/api/host/${slug}/logout`, {});
    router.push(`/host/${slug}/login`);
  }

  if (!board || !host) return <p className="text-center text-stone-500">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{board.name} · Host</h1>
          <Link href={`/r/${slug}`} className="text-sm text-stone-500 underline hover:text-stone-800">
            Open guest page
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LiveDot connected={connected} />
          <button className="btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
          <button onClick={() => setError(undefined)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <BoardStatus board={board} size={Math.min(2, Math.max(board.maxPartySize, 1))} compact />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Waitlist ({host.parties.length})</h2>
        <QueueList parties={host.parties} tables={host.tables} act={act} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tables</h2>
        <TableGrid tables={host.tables} act={act} />
      </section>

      <Settings avgTurnMinutes={host.avgTurnMinutes} act={act} />
    </div>
  );
}

function Settings({
  avgTurnMinutes,
  act,
}: {
  avgTurnMinutes: number;
  act: (path: string, body: Record<string, number>) => Promise<boolean>;
}) {
  const [value, setValue] = useState(avgTurnMinutes);
  useEffect(() => setValue(avgTurnMinutes), [avgTurnMinutes]);
  return (
    <section className="card space-y-2">
      <h2 className="text-lg font-semibold">Settings</h2>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          act("settings", { avgTurnMinutes: value });
        }}
      >
        <label className="block">
          <span className="mb-1 block text-sm text-stone-600">Average time a table stays taken (minutes)</span>
          <input
            className="input w-32"
            type="number"
            min={5}
            max={240}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </label>
        <button className="btn-primary" disabled={value === avgTurnMinutes}>
          Save
        </button>
      </form>
      <p className="text-xs text-stone-500">Used to estimate wait times for guests.</p>
    </section>
  );
}
