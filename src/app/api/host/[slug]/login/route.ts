import { z } from "zod";
import { route } from "@/lib/api";
import { allowLoginAttempt, startHostSession } from "@/lib/auth";
import { HttpError, checkPin } from "@/lib/queue";

const Body = z.object({ pin: z.string().min(1, "Enter the PIN").max(20) });

export const POST = route(Body, async ({ pin }, { slug }: { slug: string }) => {
  if (!allowLoginAttempt(slug)) throw new HttpError(429, "Too many tries. Wait a minute.");
  if (!(await checkPin(slug, pin))) throw new HttpError(401, "Wrong PIN");
  await startHostSession(slug);
});
