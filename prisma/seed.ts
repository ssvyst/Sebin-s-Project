import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
const token = () => randomBytes(12).toString("base64url");

type SeedTable = { label: string; seats: number; occupiedMinutesAgo?: number };
type SeedParty = { name: string; size: number; joinedMinutesAgo: number };

const restaurants: {
  slug: string;
  name: string;
  address: string;
  pin: string;
  avgTurnMinutes: number;
  tables: SeedTable[];
  parties: SeedParty[];
}[] = [
  {
    // Busy: every table taken, two parties already waiting.
    slug: "demo-bistro",
    name: "Demo Bistro",
    address: "12 Market St",
    pin: "1234",
    avgTurnMinutes: 45,
    tables: [
      { label: "T1", seats: 2, occupiedMinutesAgo: 30 },
      { label: "T2", seats: 2, occupiedMinutesAgo: 10 },
      { label: "T3", seats: 4, occupiedMinutesAgo: 40 },
      { label: "T4", seats: 4, occupiedMinutesAgo: 5 },
      { label: "T5", seats: 6, occupiedMinutesAgo: 20 },
    ],
    parties: [
      { name: "Alex", size: 2, joinedMinutesAgo: 12 },
      { name: "Jordan", size: 4, joinedMinutesAgo: 6 },
    ],
  },
  {
    // Quiet: free tables, nobody waiting.
    slug: "sakura-sushi",
    name: "Sakura Sushi",
    address: "88 River Rd",
    pin: "2345",
    avgTurnMinutes: 60,
    tables: [
      { label: "Bar 1", seats: 2 },
      { label: "Bar 2", seats: 2, occupiedMinutesAgo: 15 },
      { label: "Booth A", seats: 4 },
      { label: "Booth B", seats: 6, occupiedMinutesAgo: 25 },
    ],
    parties: [],
  },
  {
    // Full but no queue yet.
    slug: "taco-town",
    name: "Taco Town",
    address: "5 Sunset Ave",
    pin: "3456",
    avgTurnMinutes: 30,
    tables: [
      { label: "1", seats: 4, occupiedMinutesAgo: 20 },
      { label: "2", seats: 4, occupiedMinutesAgo: 8 },
      { label: "3", seats: 8, occupiedMinutesAgo: 15 },
    ],
    parties: [],
  },
];

async function main() {
  await prisma.restaurant.deleteMany();
  for (const r of restaurants) {
    await prisma.restaurant.create({
      data: {
        slug: r.slug,
        name: r.name,
        address: r.address,
        pinHash: await bcrypt.hash(r.pin, 10),
        avgTurnMinutes: r.avgTurnMinutes,
        tables: {
          create: r.tables.map((t) => ({
            label: t.label,
            seats: t.seats,
            status: t.occupiedMinutesAgo === undefined ? "FREE" : "OCCUPIED",
            occupiedSince: t.occupiedMinutesAgo === undefined ? null : minutesAgo(t.occupiedMinutesAgo),
          })),
        },
        parties: {
          create: r.parties.map((p) => ({
            name: p.name,
            size: p.size,
            token: token(),
            joinedAt: minutesAgo(p.joinedMinutesAgo),
          })),
        },
      },
    });
    console.log(`Seeded ${r.name} (/r/${r.slug}, host PIN ${r.pin})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
