import { sseResponse } from "@/lib/api";
import { subscribe } from "@/lib/events";
import { getDirectory } from "@/lib/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Live feed for the directory page: summary boards for every restaurant.
export async function GET(req: Request) {
  return sseResponse(
    req,
    async (send) => send("directory", await getDirectory()),
    (listener) => subscribe(() => listener()),
  );
}
