import { z } from "zod";
import { route } from "@/lib/api";
import { startHostSession } from "@/lib/auth";
import { createRestaurant } from "@/lib/queue";

const Body = z.object({
  name: z.string().trim().min(1, "Enter the restaurant name").max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Link name: lowercase letters, numbers and dashes only")
    .max(40),
  address: z.string().trim().max(120).default(""),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4 to 8 digits"),
  avgTurnMinutes: z.coerce.number().int().min(5).max(240).default(45),
  tables: z
    .array(z.object({ label: z.string().trim().min(1).max(20), seats: z.coerce.number().int().min(1).max(30) }))
    .min(1, "Add at least one table")
    .max(200),
});

export const POST = route(Body, async (body) => {
  await createRestaurant(body);
  await startHostSession(body.slug);
  return { slug: body.slug };
});
