import { z } from "zod";
import { route } from "@/lib/api";
import { leaveQueue } from "@/lib/queue";

const Body = z.object({ token: z.string().min(1).max(64) });

export const POST = route(Body, async ({ token }, { slug }: { slug: string }) => {
  await leaveQueue(slug, token);
});
