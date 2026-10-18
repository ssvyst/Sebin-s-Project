import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RolePicker } from "@/components/RolePicker";
import { LAST_RESTAURANT_COOKIE, ROLE_COOKIE, homeFor } from "@/lib/role";

export const dynamic = "force-dynamic";

// First visit: ask guest or owner. Later visits: go straight to the right home.
export default async function Start() {
  const jar = await cookies();
  const role = jar.get(ROLE_COOKIE)?.value;
  const last = jar.get(LAST_RESTAURANT_COOKIE)?.value;
  if (role === "guest" || role === "owner") redirect(homeFor(role, last));
  return <RolePicker lastRestaurant={last} />;
}
