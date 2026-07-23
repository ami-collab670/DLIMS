import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { shortJobId } from "@/lib/laboratory";
import type { DiscountApproval } from "@/types/laboratory";

type DiscountReviewPanelProps = {
  selected: DiscountApproval;
  reviewNote: string;
  onReviewNoteChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  approvePending: boolean;
  rejectPending: boolean;
};

export function DiscountReviewPanel({
  selected,
  reviewNote,
  onReviewNoteChange,
  onApprove,
  onReject,
  onCancel,
  approvePending,
  rejectPending,
}: DiscountReviewPanelProps) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <p className="text-sm font-medium">Review discount — {shortJobId(selected.job)}</p>
      <div className="space-y-1">
        <Label>Review note</Label>
        <Textarea
          rows={2}
          value={reviewNote}
          onChange={(e) => onReviewNoteChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={approvePending} onClick={onApprove}>
          Approve
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={rejectPending}
          onClick={onReject}
        >
          Reject
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
