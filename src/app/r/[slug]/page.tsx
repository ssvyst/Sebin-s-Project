import { notFound } from "next/navigation";
import { RestaurantView } from "@/components/RestaurantView";
import { getBoard } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const board = await getBoard((await params).slug);
  if (!board) notFound();
  return <RestaurantView initial={board} />;
}
