import { useSearchParams } from "react-router-dom";

import { ClientComplaintForm } from "./client-complaint-form";
import { ClientComplaintsPageHeader } from "./client-complaints-page-header";
import { ClientComplaintsSection } from "./client-complaints-section";

export default function ClientComplaintsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultJobId = searchParams.get("job");

  const openComplaint = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("complaint", id);
      return next;
    });
  };

  return (
    <div className="flex min-h-[min(80vh,720px)] flex-col gap-6">
      <ClientComplaintsPageHeader />
      <ClientComplaintForm
        defaultJobId={defaultJobId}
        onCreated={(complaint) => openComplaint(complaint.id)}
      />
      <ClientComplaintsSection />
    </div>
  );
}
