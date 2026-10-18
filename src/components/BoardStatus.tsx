import type { BoardSnapshot } from "@/lib/types";

type Tone = "go" | "wait" | "none";

export function describeWait(board: BoardSnapshot, size: number): { tone: Tone; title: string; detail: string } {
  const wait = size > board.maxPartySize ? null : board.waitBySize[size];
  const ahead = `${board.waitingCount} ${board.waitingCount === 1 ? "party" : "parties"} in line`;
  if (wait === null || wait === undefined) {
    return { tone: "none", title: `No table for ${size}`, detail: "Please ask the host" };
  }
  if (wait === 0) {
    return {
      tone: "go",
      title: "Seat now",
      detail: board.waitingCount ? `A table for ${size} is free · ${ahead}` : "No wait, walk right in",
    };
  }
  return {
    tone: "wait",
    title: `~${wait} min wait`,
    detail: board.waitingCount ? ahead : "All tables taken · no line yet",
  };
}

const toneStyles: Record<Tone, string> = {
  go: "bg-emerald-50 border-emerald-200 text-emerald-900",
  wait: "bg-amber-50 border-amber-200 text-amber-900",
  none: "bg-stone-100 border-stone-200 text-stone-700",
};
const dots: Record<Tone, string> = { go: "bg-emerald-500", wait: "bg-amber-500", none: "bg-stone-400" };

/** The sign that says "Seat now" or "~20 min wait" for a party of `size`. */
export function BoardStatus({
  board,
  size,
  compact = false,
}: {
  board: BoardSnapshot;
  size: number;
  compact?: boolean;
}) {
  const { tone, title, detail } = describeWait(board, size);
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${toneStyles[tone]}`}>
        <span className={`h-2 w-2 rounded-full ${dots[tone]}`} />
        <span className="font-semibold">{title}</span>
        <span className="opacity-75">· {detail}</span>
      </div>
    );
  }
  return (
    <div className={`rounded-2xl border p-5 ${toneStyles[tone]}`} aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-medium opacity-80">
        <span className={`h-2.5 w-2.5 rounded-full ${dots[tone]} ${tone === "go" ? "animate-pulse" : ""}`} />
        Party of {size}
      </div>
      <div className="mt-1 text-3xl font-bold tracking-tight">{title}</div>
      <div className="mt-1 text-sm opacity-80">{detail}</div>
      <div className="mt-3 text-xs opacity-60">
        {board.freeTables} of {board.totalTables} tables free
      </div>
    </div>
  );
}
