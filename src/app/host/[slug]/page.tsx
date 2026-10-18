import { notFound, redirect } from "next/navigation";
import { HostDashboard } from "@/components/HostDashboard";
import { isHostOf } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } }))) notFound();
  if (!(await isHostOf(slug))) redirect(`/host/${slug}/login`);
  return <HostDashboard slug={slug} />;
}
