import { describe, expect, it } from "vitest";
import { OVERDUE_GRACE_MINUTES, estimateBoard, type TableLite } from "./board";

const now = new Date("2026-01-01T19:00:00Z");
const ago = (m: number) => new Date(now.getTime() - m * 60_000);
const free = (id: string, seats: number): TableLite => ({ id, seats, status: "FREE", occupiedSince: null });
const taken = (id: string, seats: number, minutesAgo: number): TableLite => ({
  id,
  seats,
  status: "OCCUPIED",
  occupiedSince: ago(minutesAgo),
});

describe("estimateBoard", () => {
  it("says seat now when a fitting table is free and nobody is waiting", () => {
    const b = estimateBoard([free("a", 2), taken("b", 4, 10)], [], 45, now);
    expect(b.waitBySize[2]).toBe(0);
    expect(b.waitBySize[1]).toBe(0);
    expect(b.waitBySize[4]).toBe(35); // 45 min turn - 10 min already seated
    expect(b.maxPartySize).toBe(4);
  });

  it("gives the free table to the party already in line, not the newcomer", () => {
    const b = estimateBoard([free("a", 2), taken("b", 2, 30)], [{ id: "p1", size: 2 }], 45, now);
    expect(b.etaByParty.p1).toBe(0);
    expect(b.waitBySize[2]).toBe(15); // next table frees in 45 - 30
  });

  it("queues parties behind each other on the same table", () => {
    const b = estimateBoard(
      [taken("a", 4, 40)],
      [
        { id: "p1", size: 2 },
        { id: "p2", size: 4 },
      ],
      45,
      now,
    );
    expect(b.etaByParty.p1).toBe(5);
    expect(b.etaByParty.p2).toBe(50);
    expect(b.waitBySize[4]).toBe(95);
  });

  it("treats overdue tables as freeing up shortly instead of in the past", () => {
    const b = estimateBoard([taken("a", 2, 120)], [], 45, now);
    expect(b.waitBySize[2]).toBe(OVERDUE_GRACE_MINUTES);
  });

  it("reports null when no table is big enough", () => {
    const b = estimateBoard([free("a", 2)], [{ id: "big", size: 6 }], 45, now);
    expect(b.etaByParty.big).toBeNull();
    expect(b.waitBySize[3]).toBeUndefined();
    expect(b.maxPartySize).toBe(2);
  });

  it("puts small parties at the smallest free table so big tables stay open", () => {
    const b = estimateBoard([free("big", 6), free("small", 2)], [{ id: "p1", size: 2 }], 45, now);
    expect(b.etaByParty.p1).toBe(0);
    expect(b.waitBySize[6]).toBe(0); // the 6-top is still free
  });
});
