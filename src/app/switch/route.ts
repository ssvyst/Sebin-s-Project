import { NextResponse } from "next/server";
import { ROLE_COOKIE } from "@/lib/role";

// Forget the remembered guest/owner choice and show the start screen again.
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.delete(ROLE_COOKIE);
  return res;
}
