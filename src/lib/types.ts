// Shapes sent to the browser over the live stream. Safe to import from client code.

export type BoardSnapshot = {
  slug: string;
  name: string;
  address: string;
  freeTables: number;
  totalTables: number;
  waitingCount: number;
  /** Minutes a newcomer of each party size would wait: 0 = seat now, null = no table fits. */
  waitBySize: Record<number, number | null>;
  maxPartySize: number;
  avgTurnMinutes: number;
};

export type PartyStatus = "WAITING" | "NOTIFIED" | "SEATED" | "LEFT";

export type GuestSnapshot = {
  name: string;
  size: number;
  status: PartyStatus;
  /** Parties in line before this one (only while waiting). */
  ahead: number | null;
  etaMinutes: number | null;
};

export type HostTable = {
  id: string;
  label: string;
  seats: number;
  status: "FREE" | "OCCUPIED";
  occupiedMinutes: number | null;
};

export type HostParty = {
  id: string;
  name: string;
  size: number;
  phone: string | null;
  status: "WAITING" | "NOTIFIED";
  waitedMinutes: number;
  etaMinutes: number | null;
};

export type HostSnapshot = {
  tables: HostTable[];
  parties: HostParty[];
  avgTurnMinutes: number;
};
