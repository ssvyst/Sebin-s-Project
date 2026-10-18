// Cookies that remember who this browser belongs to. Readable by client and server code.

export const ROLE_COOKIE = "role"; // "guest" | "owner"
export const LAST_RESTAURANT_COOKIE = "last_restaurant"; // slug the owner last logged into
export const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type Role = "guest" | "owner";

export const homeFor = (role: Role, lastRestaurant?: string) =>
  role === "guest" ? "/eat" : lastRestaurant ? `/host/${lastRestaurant}` : "/host";
