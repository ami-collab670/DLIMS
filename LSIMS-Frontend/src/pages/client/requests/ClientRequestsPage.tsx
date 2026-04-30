import { ClientNewJobRequestForm } from "@/features/jobs/client-new-job-request-form";
import { useSearchParams } from "react-router-dom";

import { ClientRequestsPageHeader } from "./client-requests-page-header";
import { ClientRequestsSection } from "./client-requests-section";

export default function ClientRequestsPage() {
  const [, setSearchParams] = useSearchParams();

  const openJob = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("job", id);
      return next;
    });
  };

  return (
    <div className="flex min-h-[min(80vh,720px)] flex-col gap-6">
      <ClientRequestsPageHeader />
      <ClientNewJobRequestForm onCreated={(job) => openJob(job.id)} />
      <ClientRequestsSection />
    </div>
  );
}
