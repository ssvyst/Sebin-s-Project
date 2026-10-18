import { z } from "zod";
import { route } from "@/lib/api";
import { addTable, removeTable, setTableStatus } from "@/lib/queue";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set"), tableId: z.string(), status: z.enum(["FREE", "OCCUPIED"]) }),
  z.object({
    action: z.literal("add"),
    label: z.string().trim().min(1, "Give the table a name").max(20),
    seats: z.coerce.number().int().min(1).max(30),
  }),
  z.object({ action: z.literal("remove"), tableId: z.string() }),
]);

export const POST = route(
  Body,
  async (body, { slug }: { slug: string }) => {
    if (body.action === "set") await setTableStatus(slug, body.tableId, body.status);
    else if (body.action === "add") await addTable(slug, body.label, body.seats);
    else await removeTable(slug, body.tableId);
  },
  { host: true },
);
