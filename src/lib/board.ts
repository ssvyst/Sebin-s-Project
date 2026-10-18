// Pure wait-time math: no database access, so it is easy to unit test.

export type TableLite = {
  id: string;
  seats: number;
  status: string; // "FREE" | "OCCUPIED"
  occupiedSince: Date | null;
};

export type PartyLite = { id: string; size: number };

/** When an occupied table is past its expected turn time, assume it frees up this soon. */
export const OVERDUE_GRACE_MINUTES = 5;

const MINUTE = 60_000;

type Slot = { seats: number; freeAt: number };

function toSlots(tables: TableLite[], avgTurnMinutes: number, now: number): Slot[] {
  return tables.map((t) => {
    if (t.status === "FREE") return { seats: t.seats, freeAt: now };
    const since = t.occupiedSince?.getTime() ?? now;
    const expected = since + avgTurnMinutes * MINUTE;
    return { seats: t.seats, freeAt: Math.max(expected, now + OVERDUE_GRACE_MINUTES * MINUTE) };
  });
}

/** Earliest-free table that fits; ties go to the smallest table so big tables stay open. */
function bestSlot(slots: Slot[], size: number): Slot | null {
  let best: Slot | null = null;
  for (const s of slots) {
    if (s.seats < size) continue;
    if (!best || s.freeAt < best.freeAt || (s.freeAt === best.freeAt && s.seats < best.seats)) best = s;
  }
  return best;
}

const minutesUntil = (at: number, now: number) => Math.max(0, Math.ceil((at - now) / MINUTE));

export type BoardEstimate = {
  /** Minutes until each queued party should get a table (null = no table is big enough). */
  etaByParty: Record<string, number | null>;
  /** For a party joining now: minutes of wait by party size (0 = seat now, null = too big). */
  waitBySize: Record<number, number | null>;
  maxPartySize: number;
};

/**
 * Walks the queue in order, handing each party the table that frees up first,
 * then reports what a newcomer of each size would wait behind them.
 */
export function estimateBoard(
  tables: TableLite[],
  queue: PartyLite[],
  avgTurnMinutes: number,
  now: Date = new Date(),
): BoardEstimate {
  const t0 = now.getTime();
  const slots = toSlots(tables, avgTurnMinutes, t0);
  const etaByParty: Record<string, number | null> = {};

  for (const party of queue) {
    const slot = bestSlot(slots, party.size);
    if (!slot) {
      etaByParty[party.id] = null;
      continue;
    }
    const start = Math.max(slot.freeAt, t0);
    etaByParty[party.id] = minutesUntil(start, t0);
    slot.freeAt = start + avgTurnMinutes * MINUTE;
  }

  const maxPartySize = tables.reduce((m, t) => Math.max(m, t.seats), 0);
  const waitBySize: Record<number, number | null> = {};
  for (let size = 1; size <= maxPartySize; size++) {
    const slot = bestSlot(slots, size);
    waitBySize[size] = slot ? minutesUntil(slot.freeAt, t0) : null;
  }

  return { etaByParty, waitBySize, maxPartySize };
}
