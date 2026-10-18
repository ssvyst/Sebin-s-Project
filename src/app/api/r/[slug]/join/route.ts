import { z } from "zod";
import { route } from "@/lib/api";
import { joinQueue } from "@/lib/queue";

const Body = z.object({
  name: z.string().trim().min(1, "Please enter a name").max(40, "Name is too long"),
  size: z.coerce.number().int().min(1, "Party size must be at least 1").max(30),
  phone: z.string().trim().max(30).optional(),
});

export const POST = route(Body, async (body, { slug }: { slug: string }) => ({
  token: await joinQueue(slug, body),
}));
