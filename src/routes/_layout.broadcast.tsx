import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/_layout/broadcast")({
  component: BroadcastPage,
});

function BroadcastPage() {
  return (
    <div className="rounded-2xl bg-card p-12 text-center shadow-sm">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold-soft">
        <Radio className="h-9 w-9 text-gold" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Broadcast</h1>
      <p className="mt-2 text-sm text-muted-foreground">Send announcements to all subscribers.</p>
    </div>
  );
}
