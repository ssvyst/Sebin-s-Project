import { WaitView } from "@/components/WaitView";

export default async function WaitPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  return <WaitView slug={slug} token={token} />;
}
