import { Suspense } from "react";
import { EventVenueList } from "@/components/event-venue-list";

export default function ProtectedPage() {
  return (
    <Suspense>
      <EventVenueList />
    </Suspense>
  );
}
