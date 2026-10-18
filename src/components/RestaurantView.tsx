"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveBoard } from "@/hooks/useLiveBoard";
import { savedToken } from "@/lib/client";
import type { BoardSnapshot } from "@/lib/types";
import { BoardStatus } from "./BoardStatus";
import { JoinForm } from "./JoinForm";
import { LiveDot } from "./LiveDot";

export function RestaurantView({ initial }: { initial: BoardSnapshot }) {
  const { board = initial, connected } = useLiveBoard(initial.slug, { initial });
  const [size, setSize] = useState(Math.min(2, Math.max(initial.maxPartySize, 1)));
  const [existing, setExisting] = useState<string | null>(null);

  useEffect(() => setExisting(savedToken.get(initial.slug)), [initial.slug]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{board.name}</h1>
          {board.address && <p className="text-stone-500">{board.address}</p>}
        </div>
        <LiveDot connected={connected} />
      </div>

      {existing && (
        <Link
          href={`/r/${board.slug}/wait/${existing}`}
          className="block rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-900"
        >
          You may already be in line here. <span className="font-semibold underline">See your spot →</span>
        </Link>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <BoardStatus board={board} size={size} />
        <JoinForm slug={board.slug} maxPartySize={board.maxPartySize} size={size} onSizeChange={setSize} />
      </div>
    </div>
  );
}
