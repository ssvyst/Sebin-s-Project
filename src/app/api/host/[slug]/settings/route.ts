import { z } from "zod";
import { route } from "@/lib/api";
import { updateSettings } from "@/lib/queue";

const Body = z.object({ avgTurnMinutes: z.coerce.number().int().min(5).max(240) });

export const POST = route(
  Body,
  async ({ avgTurnMinutes }, { slug }: { slug: string }) => {
    await updateSettings(slug, avgTurnMinutes);
  },
  { host: true },
);
