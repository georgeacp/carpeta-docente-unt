import { Suspense } from "react";
import { ReviewDashboard } from "@/components/carpetas/review-dashboard";

export default function Page() {
  return (
    <Suspense>
      <ReviewDashboard seguimiento />
    </Suspense>
  );
}
