import { isHostOf } from "@/lib/auth";
import { sseResponse } from "@/lib/api";
import { subscribe } from "@/lib/events";
import { getSnapshots } from "@/lib/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Live feed for one restaurant: always the public board, plus "you" for a guest
// token and "host" details when the host is logged in.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? undefined;
  const host = await isHostOf(slug);

  return sseResponse(
    req,
    async (send) => {
      const snap = await getSnapshots(slug, { token, host });
      if (!snap) return send("gone", {});
      send("board", snap.board);
      if (token) send("you", snap.you ?? null);
      if (host) send("host", snap.host);
    },
    (listener) => subscribe((changed) => changed === slug && listener()),
  );
}
