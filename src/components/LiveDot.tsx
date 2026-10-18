export function LiveDot({ connected }: { connected: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-stone-500">
      <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-emerald-500" : "bg-stone-300"}`} />
      {connected ? "Live" : "Reconnecting…"}
    </span>
  );
}
