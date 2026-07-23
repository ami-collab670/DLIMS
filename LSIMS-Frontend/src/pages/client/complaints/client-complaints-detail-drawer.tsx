import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ComplaintRecord } from "@/types/laboratory";

import { ClientComplaintDetailPanel } from "./client-complaint-detail-panel";

type ClientComplaintsDetailDrawerProps = {
  selectedComplaintId: string;
  displayComplaint: ComplaintRecord | null;
  detailLoading: boolean;
  detailError: boolean;
  onClose: () => void;
};

export function ClientComplaintsDetailDrawer({
  selectedComplaintId,
  displayComplaint,
  detailLoading,
  detailError,
  onClose,
}: ClientComplaintsDetailDrawerProps) {
  if (!selectedComplaintId) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:static lg:z-auto lg:w-[380px] lg:shrink-0 lg:self-start">
      <button
        type="button"
        className="flex-1 bg-background/80 backdrop-blur-sm lg:hidden"
        aria-label="Close details"
        onClick={onClose}
      />
      <div className="w-full max-w-md animate-in slide-in-from-right lg:max-w-none lg:animate-none">
        {detailLoading && !displayComplaint ? (
          <div className="flex h-full min-h-[200px] items-center justify-center border-l border-border bg-card">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : detailError ? (
          <div className="flex h-full flex-col justify-center gap-2 border-l border-border bg-card p-4 text-sm text-destructive">
            Could not load this complaint. It may have been removed or you may not have
            access.
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : displayComplaint ? (
          <ClientComplaintDetailPanel complaint={displayComplaint} onClose={onClose} />
        ) : (
          <div className="flex h-full items-center justify-center border-l border-border bg-card p-4 text-sm text-muted-foreground">
            Complaint not found.
          </div>
        )}
      </div>
    </div>
  );
}
