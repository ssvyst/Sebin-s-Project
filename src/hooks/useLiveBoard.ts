"use client";

import { useEffect, useState } from "react";
import type { BoardSnapshot, GuestSnapshot, HostSnapshot } from "@/lib/types";

type Live = {
  board?: BoardSnapshot;
  /** undefined = still loading, null = token not found */
  you?: GuestSnapshot | null;
  host?: HostSnapshot;
  gone?: boolean;
};

/** Keeps a live connection to one restaurant. EventSource reconnects on its own after drops. */
export function useLiveBoard(slug: string, opts: { token?: string; initial?: BoardSnapshot } = {}) {
  const { token, initial } = opts;
  const [live, setLive] = useState<Live>({ board: initial });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    const es = new EventSource(`/api/r/${encodeURIComponent(slug)}/stream${qs}`);
    const on = <K extends keyof Live>(name: string, field: K) =>
      es.addEventListener(name, (e) => {
        const value = JSON.parse((e as MessageEvent).data);
        setLive((s) => ({ ...s, [field]: value }));
      });
    on("board", "board");
    on("you", "you");
    on("host", "host");
    es.addEventListener("gone", () => setLive((s) => ({ ...s, gone: true })));
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, [slug, token]);

  return { ...live, connected };
}

/** Live summaries of every restaurant, for the directory page. */
export function useLiveDirectory(initial: BoardSnapshot[]) {
  const [boards, setBoards] = useState(initial);
  useEffect(() => {
    const es = new EventSource("/api/stream/all");
    es.addEventListener("directory", (e) => setBoards(JSON.parse((e as MessageEvent).data)));
    return () => es.close();
  }, []);
  return boards;
}
