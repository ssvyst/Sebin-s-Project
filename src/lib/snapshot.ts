import { prisma } from "./db";
import { estimateBoard } from "./board";
import type { BoardSnapshot, GuestSnapshot, HostSnapshot, PartyStatus } from "./types";

const ACTIVE = ["WAITING", "NOTIFIED"];
const byLabel = (a: { label: string }, b: { label: string }) =>
  a.label.localeCompare(b.label, undefined, { numeric: true });
const minutesSince = (d: Date, now: number) => Math.max(0, Math.floor((now - d.getTime()) / 60_000));

/** Loads a restaurant's tables and queue and runs the wait estimate once. */
async function load(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      tables: true,
      parties: { where: { status: { in: ACTIVE } }, orderBy: { joinedAt: "asc" } },
    },
  });
  if (!restaurant) return null;
  const now = new Date();
  const estimate = estimateBoard(restaurant.tables, restaurant.parties, restaurant.avgTurnMinutes, now);
  return { restaurant, estimate, now: now.getTime() };
}

type Loaded = NonNullable<Awaited<ReturnType<typeof load>>>;

function toBoard({ restaurant: r, estimate }: Loaded): BoardSnapshot {
  return {
    slug: r.slug,
    name: r.name,
    address: r.address,
    freeTables: r.tables.filter((t) => t.status === "FREE").length,
    totalTables: r.tables.length,
    waitingCount: r.parties.length,
    waitBySize: estimate.waitBySize,
    maxPartySize: estimate.maxPartySize,
    avgTurnMinutes: r.avgTurnMinutes,
  };
}

function toHost({ restaurant: r, estimate, now }: Loaded): HostSnapshot {
  return {
    avgTurnMinutes: r.avgTurnMinutes,
    tables: [...r.tables].sort(byLabel).map((t) => ({
      id: t.id,
      label: t.label,
      seats: t.seats,
      status: t.status === "OCCUPIED" ? "OCCUPIED" : "FREE",
      occupiedMinutes: t.status === "OCCUPIED" && t.occupiedSince ? minutesSince(t.occupiedSince, now) : null,
    })),
    parties: r.parties.map((p) => ({
      id: p.id,
      name: p.name,
      size: p.size,
      phone: p.phone,
      status: p.status === "NOTIFIED" ? "NOTIFIED" : "WAITING",
      waitedMinutes: minutesSince(p.joinedAt, now),
      etaMinutes: estimate.etaByParty[p.id] ?? null,
    })),
  };
}

async function toGuest(loaded: Loaded, token: string): Promise<GuestSnapshot | null> {
  const { restaurant: r, estimate } = loaded;
  const index = r.parties.findIndex((p) => p.token === token);
  if (index >= 0) {
    const p = r.parties[index];
    return {
      name: p.name,
      size: p.size,
      status: p.status as PartyStatus,
      ahead: index,
      etaMinutes: estimate.etaByParty[p.id] ?? null,
    };
  }
  // Already seated or left: still show them their final status.
  const p = await prisma.party.findFirst({ where: { token, restaurantId: r.id } });
  if (!p) return null;
  return { name: p.name, size: p.size, status: p.status as PartyStatus, ahead: null, etaMinutes: null };
}

export async function getSnapshots(slug: string, opts: { token?: string; host?: boolean } = {}) {
  const loaded = await load(slug);
  if (!loaded) return null;
  return {
    board: toBoard(loaded),
    you: opts.token ? await toGuest(loaded, opts.token) : undefined,
    host: opts.host ? toHost(loaded) : undefined,
  };
}

export async function getBoard(slug: string): Promise<BoardSnapshot | null> {
  const loaded = await load(slug);
  return loaded ? toBoard(loaded) : null;
}

export async function getDirectory(): Promise<BoardSnapshot[]> {
  const all = await prisma.restaurant.findMany({ select: { slug: true }, orderBy: { name: "asc" } });
  const boards = await Promise.all(all.map((r) => getBoard(r.slug)));
  return boards.filter((b): b is BoardSnapshot => b !== null);
}
