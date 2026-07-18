import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createComplaint } from "@/features/laboratory/complaints-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ComplaintCategory, ComplaintRecord } from "@/types/laboratory";

import { COMPLAINT_CATEGORY_OPTIONS } from "./constants";

type ClientComplaintFormProps = {
  defaultJobId?: string | null;
  showJobField?: boolean;
  compact?: boolean;
  onCreated?: (complaint: ComplaintRecord) => void;
};

export function ClientComplaintForm({
  defaultJobId,
  showJobField = true,
  compact = false,
  onCreated,
}: ClientComplaintFormProps) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<ComplaintCategory>("other");
  const [description, setDescription] = useState("");
  const [jobId, setJobId] = useState(defaultJobId ?? "");

  useEffect(() => {
    if (defaultJobId) {
      setJobId(defaultJobId);
    }
  }, [defaultJobId]);

  const createMut = useMutation({
    mutationFn: () =>
      createComplaint({
        job: jobId.trim() || null,
        category,
        description: description.trim(),
      }),
    onSuccess: (complaint) => {
      toast.success("Complaint submitted. Laboratory staff will review it.");
      setDescription("");
      if (!defaultJobId) {
        setJobId("");
      }
      setCategory("other");
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onCreated?.(complaint);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      toast.error("Please describe the issue (at least 10 characters).");
      return;
    }
    createMut.mutate();
  };

  return (
    <form
      className={
        compact
          ? "space-y-3"
          : "grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
      }
      onSubmit={handleSubmit}
    >
      {showJobField ? (
        <div className={compact ? "space-y-1" : "space-y-1 md:col-span-1"}>
          <Label htmlFor="complaint-job">Job ID (optional)</Label>
          <Input
            id="complaint-job"
            className="font-mono text-sm"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Link to a job order"
            disabled={Boolean(defaultJobId)}
          />
        </div>
      ) : null}
      <div className={compact ? "space-y-1" : "space-y-1 md:col-span-1"}>
        <Label htmlFor="complaint-category">Category</Label>
        <select
          id="complaint-category"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={category}
          onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
        >
          {COMPLAINT_CATEGORY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className={compact ? "space-y-1" : "space-y-1 md:col-span-2"}>
        <Label htmlFor="complaint-description">Description</Label>
        <Textarea
          id="complaint-description"
          rows={compact ? 3 : 4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What went wrong?"
        />
      </div>
      <div className={compact ? undefined : "md:col-span-2"}>
        <Button type="submit" size={compact ? "sm" : "default"} disabled={createMut.isPending}>
          Submit complaint
        </Button>
      </div>
    </form>
  );
}
