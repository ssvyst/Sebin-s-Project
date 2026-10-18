import { notFound } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await prisma.restaurant.findUnique({ where: { slug }, select: { name: true } });
  if (!r) notFound();
  return <LoginForm slug={slug} name={r.name} />;
}
