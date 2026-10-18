import { z } from "zod";
import { route } from "@/lib/api";
import { notifyParty, removeParty, seatParty } from "@/lib/queue";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("notify"), partyId: z.string() }),
  z.object({ action: z.literal("seat"), partyId: z.string(), tableId: z.string().min(1, "Pick a table") }),
  z.object({ action: z.literal("remove"), partyId: z.string() }),
]);

export const POST = route(
  Body,
  async (body, { slug }: { slug: string }) => {
    if (body.action === "notify") await notifyParty(slug, body.partyId);
    else if (body.action === "seat") await seatParty(slug, body.partyId, body.tableId);
    else await removeParty(slug, body.partyId);
  },
  { host: true },
);
