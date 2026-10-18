import { EventEmitter } from "node:events";

// In-process broadcaster. Every change publishes the restaurant's slug, and every
// open live stream re-sends its snapshot. To run on several servers (e.g. Vercel),
// swap this module for Redis pub/sub; nothing else needs to change.

const g = globalThis as unknown as { __waitlistHub?: EventEmitter };
const hub =
  g.__waitlistHub ??
  (() => {
    const e = new EventEmitter();
    e.setMaxListeners(0);
    return e;
  })();
g.__waitlistHub = hub;

export function publish(slug: string) {
  hub.emit("change", slug);
}

export function subscribe(listener: (slug: string) => void): () => void {
  hub.on("change", listener);
  return () => hub.off("change", listener);
}
