"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLiveBoard } from "@/hooks/useLiveBoard";
import { postJson, savedToken } from "@/lib/client";
import { LiveDot } from "./LiveDot";

/** The guest's private "place in line" page. */
export function WaitView({ slug, token }: { slug: string; token: string }) {
  const { board, you, connected } = useLiveBoard(slug, { token });
  const alerts = useAlerts();
  const prevStatus = useRef<string | undefined>(undefined);

  // Fire the alert only when the status *changes* to NOTIFIED while this page is open.
  useEffect(() => {
    const status = you?.status;
    if (status === "NOTIFIED" && prevStatus.current && prevStatus.current !== "NOTIFIED") {
      alerts.fire(board?.name ?? "The restaurant");
    }
    if (status === "SEATED" || status === "LEFT") savedToken.clear(slug);
    if (status) prevStatus.current = status;
  }, [you?.status, board?.name, slug, alerts]);

  async function leave() {
    if (!confirm("Leave the line? You'll lose your spot.")) return;
    await postJson(`/api/r/${slug}/leave`, { token });
  }

  if (you === undefined) return <p className="text-center text-stone-500">Finding your spot…</p>;
  if (you === null) {
    return (
      <div className="card text-center">
        <p>We couldn&apos;t find that spot in line.</p>
        <Link className="btn-primary mt-4" href={`/r/${slug}`}>
          Back to {board?.name ?? "the restaurant"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/r/${slug}`} className="text-sm text-stone-500 hover:text-stone-800">
          ← {board?.name}
        </Link>
        <LiveDot connected={connected} />
      </div>

      {you.status === "NOTIFIED" && (
        <div className="rounded-2xl bg-emerald-600 p-6 text-center text-white shadow-lg" role="alert">
          <div className="text-4xl">🔔</div>
          <div className="mt-2 text-2xl font-bold">Your table is ready!</div>
          <div className="mt-1 opacity-90">Please head to the host stand.</div>
        </div>
      )}

      {you.status === "WAITING" && (
        <div className="card text-center">
          <div className="text-sm text-stone-500">
            {you.name} · party of {you.size}
          </div>
          <div className="mt-3 text-6xl font-bold tracking-tight">{you.ahead === 0 ? "Next!" : you.ahead}</div>
          <div className="text-stone-600">
            {you.ahead === 0 ? "You're first in line" : `${you.ahead === 1 ? "party" : "parties"} ahead of you`}
          </div>
          <div className="mt-4 rounded-xl bg-stone-100 p-3 text-sm">
            {you.etaMinutes === null
              ? "We'll find you a table soon"
              : you.etaMinutes === 0
                ? "Any minute now"
                : `Estimated wait: about ${you.etaMinutes} min`}
          </div>
        </div>
      )}

      {you.status === "SEATED" && (
        <div className="card text-center">
          <div className="text-4xl">🍽️</div>
          <div className="mt-2 text-xl font-semibold">You&apos;re seated. Enjoy your meal!</div>
        </div>
      )}

      {you.status === "LEFT" && (
        <div className="card text-center">
          <div className="text-xl font-semibold">You&apos;re no longer in line.</div>
          <Link className="btn-primary mt-4" href={`/r/${slug}`}>
            Join again
          </Link>
        </div>
      )}

      {(you.status === "WAITING" || you.status === "NOTIFIED") && (
        <div className="space-y-2">
          {alerts.state === "ask" && (
            <button className="btn-ghost w-full py-3" onClick={alerts.enable}>
              🔔 Turn on alerts so we can ping you
            </button>
          )}
          {alerts.state === "on" && (
            <p className="text-center text-sm text-emerald-700">🔔 Alerts on. Keep this page open.</p>
          )}
          {alerts.state === "blocked" && (
            <p className="text-center text-sm text-stone-500">
              Alerts are blocked in your browser. Keep this page open and we&apos;ll show a banner.
            </p>
          )}
          <button className="btn-danger w-full" onClick={leave}>
            Leave the line
          </button>
        </div>
      )}
    </div>
  );
}

/** Browser notification + beep + vibration, with a user-gesture "enable" step. */
function useAlerts() {
  const [state, setState] = useState<"ask" | "on" | "blocked">("ask");
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!("Notification" in window)) setState("blocked");
    else if (Notification.permission === "granted") setState("on");
    else if (Notification.permission === "denied") setState("blocked");
  }, []);

  const api = useRef({
    async enable() {
      try {
        audio.current ??= new AudioContext(); // created during a click, so it may play later
      } catch {}
      if (!("Notification" in window)) return setState("blocked");
      const result = await Notification.requestPermission();
      setState(result === "granted" ? "on" : "blocked");
    },
    fire(restaurant: string) {
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Your table is ready!", { body: `${restaurant}: please head to the host stand.` });
        }
      } catch {}
      try {
        navigator.vibrate?.([300, 150, 300]);
      } catch {}
      try {
        const ctx = (audio.current ??= new AudioContext());
        [0, 0.35].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.2, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.3);
          osc.connect(gain).connect(ctx.destination);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.3);
        });
      } catch {}
    },
  });

  return { state, enable: api.current.enable, fire: api.current.fire };
}
