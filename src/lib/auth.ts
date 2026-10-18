import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { LAST_RESTAURANT_COOKIE, ONE_YEAR_SECONDS, ROLE_COOKIE } from "./role";

const COOKIE = "host_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set (see .env.example)");
  return new TextEncoder().encode(s);
}

export async function startHostSession(slug: string) {
  const jwt = await new SignJWT({ slug })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  // Remember this browser as the owner's, so the start page sends them straight back here.
  const remember = { sameSite: "lax", path: "/", maxAge: ONE_YEAR_SECONDS } as const;
  jar.set(ROLE_COOKIE, "owner", remember);
  jar.set(LAST_RESTAURANT_COOKIE, slug, remember);
}

export async function endHostSession() {
  (await cookies()).delete(COOKIE);
}

export async function isHostOf(slug: string): Promise<boolean> {
  const jwt = (await cookies()).get(COOKIE)?.value;
  if (!jwt) return false;
  try {
    const { payload } = await jwtVerify(jwt, secret());
    return payload.slug === slug;
  } catch {
    return false;
  }
}

// Simple in-memory brake on PIN guessing: 5 tries per restaurant per minute.
const attempts = new Map<string, number[]>();
export function allowLoginAttempt(slug: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(slug) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  attempts.set(slug, recent);
  return recent.length <= 5;
}
