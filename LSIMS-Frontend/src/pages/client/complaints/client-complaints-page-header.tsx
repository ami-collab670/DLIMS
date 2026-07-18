import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { fetchComplaint } from "@/features/laboratory/complaints-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";

import { truncateComplaintTitle } from "./constants";

export function ClientComplaintsPageHeader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedComplaintId = searchParams.get("complaint");

  const { data: detailComplaint } = useQuery({
    queryKey: laboratoryQueryKeys.complaint(selectedComplaintId!),
    queryFn: () => fetchComplaint(selectedComplaintId!),
    enabled: Boolean(selectedComplaintId),
  });

  const closeComplaint = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("complaint");
      return next;
    });
  }, [setSearchParams]);

  if (selectedComplaintId) {
    const label = detailComplaint
      ? truncateComplaintTitle(detailComplaint.description)
      : "Complaint details";

    return (
      <div className="space-y-2">
        <Breadcrumb
          segments={[
            { label: "Home", href: "/client" },
            { label: "Complaints", onClick: closeComplaint },
            { label },
          ]}
        />
        <p className="text-sm text-muted-foreground">
          Read-only view of your submitted complaint.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">My complaints</h2>
      <p className="text-sm text-muted-foreground">
        Submit and track complaints about your jobs, samples, or results. Only your
        complaints are shown.
      </p>
    </div>
  );
}
