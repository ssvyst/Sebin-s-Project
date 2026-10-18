import { Directory } from "@/components/Directory";
import { getDirectory } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export default async function GuestHome() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Where can I eat right now?</h1>
        <p className="text-stone-600">Live wait times, updated the moment a table frees up.</p>
      </div>
      <Directory initial={await getDirectory()} />
    </div>
  );
}
