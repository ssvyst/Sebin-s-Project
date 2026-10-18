"use client";

import Link from "next/link";
import { useLiveDirectory } from "@/hooks/useLiveBoard";
import type { BoardSnapshot } from "@/lib/types";
import { BoardStatus } from "./BoardStatus";

export function Directory({ initial }: { initial: BoardSnapshot[] }) {
  const boards = useLiveDirectory(initial);
  if (!boards.length) {
    return <p className="card text-center text-stone-600">No restaurants yet. Check back soon!</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {boards.map((b) => (
        <li key={b.slug}>
          <Link href={`/r/${b.slug}`} className="card block transition hover:border-stone-400 hover:shadow-md">
            <div className="text-lg font-semibold">{b.name}</div>
            {b.address && <div className="text-sm text-stone-500">{b.address}</div>}
            <div className="mt-3">
              <BoardStatus board={b} size={Math.min(2, Math.max(b.maxPartySize, 1))} compact />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
