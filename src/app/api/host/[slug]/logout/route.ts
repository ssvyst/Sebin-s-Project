import { z } from "zod";
import { route } from "@/lib/api";
import { endHostSession } from "@/lib/auth";

export const POST = route(z.object({}), async () => {
  await endHostSession();
});
