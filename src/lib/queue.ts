import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { publish } from "./events";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function restaurantBySlug(slug: string) {
  const r = await prisma.restaurant.findUnique({ where: { slug } });
  if (!r) throw new HttpError(404, "Restaurant not found");
  return r;
}

async function activeParty(restaurantId: string, partyId: string) {
  const p = await prisma.party.findFirst({
    where: { id: partyId, restaurantId, status: { in: ["WAITING", "NOTIFIED"] } },
  });
  if (!p) throw new HttpError(404, "That party is no longer in line");
  return p;
}

async function tableOf(restaurantId: string, tableId: string) {
  const t = await prisma.table.findFirst({ where: { id: tableId, restaurantId } });
  if (!t) throw new HttpError(404, "Table not found");
  return t;
}

// ---- Guest actions ----

export async function joinQueue(slug: string, input: { name: string; size: number; phone?: string }) {
  const r = await restaurantBySlug(slug);
  const biggest = await prisma.table.aggregate({ where: { restaurantId: r.id }, _max: { seats: true } });
  if ((biggest._max.seats ?? 0) < input.size) {
    throw new HttpError(400, `No table here fits ${input.size}. Please talk to the host.`);
  }
  const token = randomBytes(12).toString("base64url");
  await prisma.party.create({
    data: { restaurantId: r.id, name: input.name, size: input.size, phone: input.phone || null, token },
  });
  publish(slug);
  return token;
}

export async function leaveQueue(slug: string, token: string) {
  const r = await restaurantBySlug(slug);
  const { count } = await prisma.party.updateMany({
    where: { token, restaurantId: r.id, status: { in: ["WAITING", "NOTIFIED"] } },
    data: { status: "LEFT" },
  });
  if (count) publish(slug);
}

// ---- Host actions ----

export async function notifyParty(slug: string, partyId: string) {
  const r = await restaurantBySlug(slug);
  await activeParty(r.id, partyId);
  await prisma.party.update({ where: { id: partyId }, data: { status: "NOTIFIED", notifiedAt: new Date() } });
  publish(slug);
}

export async function seatParty(slug: string, partyId: string, tableId: string) {
  const r = await restaurantBySlug(slug);
  const party = await activeParty(r.id, partyId);
  const table = await tableOf(r.id, tableId);
  if (table.status !== "FREE") throw new HttpError(409, `${table.label} is not free`);
  if (table.seats < party.size) throw new HttpError(400, `${table.label} only seats ${table.seats}`);
  const now = new Date();
  await prisma.$transaction([
    prisma.table.update({ where: { id: table.id }, data: { status: "OCCUPIED", occupiedSince: now } }),
    prisma.party.update({ where: { id: party.id }, data: { status: "SEATED", seatedAt: now, tableId: table.id } }),
  ]);
  publish(slug);
}

export async function removeParty(slug: string, partyId: string) {
  const r = await restaurantBySlug(slug);
  await activeParty(r.id, partyId);
  await prisma.party.update({ where: { id: partyId }, data: { status: "LEFT" } });
  publish(slug);
}

export async function setTableStatus(slug: string, tableId: string, status: "FREE" | "OCCUPIED") {
  const r = await restaurantBySlug(slug);
  await tableOf(r.id, tableId);
  await prisma.table.update({
    where: { id: tableId },
    data: { status, occupiedSince: status === "OCCUPIED" ? new Date() : null },
  });
  publish(slug);
}

export async function addTable(slug: string, label: string, seats: number) {
  const r = await restaurantBySlug(slug);
  await prisma.table.create({ data: { restaurantId: r.id, label, seats } });
  publish(slug);
}

export async function removeTable(slug: string, tableId: string) {
  const r = await restaurantBySlug(slug);
  await tableOf(r.id, tableId);
  await prisma.table.delete({ where: { id: tableId } });
  publish(slug);
}

export async function updateSettings(slug: string, avgTurnMinutes: number) {
  const r = await restaurantBySlug(slug);
  await prisma.restaurant.update({ where: { id: r.id }, data: { avgTurnMinutes } });
  publish(slug);
}

export async function checkPin(slug: string, pin: string) {
  const r = await restaurantBySlug(slug);
  return bcrypt.compare(pin, r.pinHash);
}

export async function createRestaurant(input: {
  name: string;
  slug: string;
  address: string;
  pin: string;
  avgTurnMinutes: number;
  tables: { label: string; seats: number }[];
}) {
  if (await prisma.restaurant.findUnique({ where: { slug: input.slug } })) {
    throw new HttpError(409, "That link name is taken. Try another.");
  }
  await prisma.restaurant.create({
    data: {
      name: input.name,
      slug: input.slug,
      address: input.address,
      avgTurnMinutes: input.avgTurnMinutes,
      pinHash: await bcrypt.hash(input.pin, 10),
      tables: { create: input.tables },
    },
  });
  publish(input.slug);
}
