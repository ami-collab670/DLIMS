import { ChevronDown, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { shortJobId } from "@/lib/job-order-labels";
import { cn } from "@/lib/utils";
import type { JobOrder } from "@/types/laboratory";

import { formatJobOptionLabel } from "./client-complaint-labels";

export function resolveJobFromQuery(
  jobs: JobOrder[],
  query: string,
): JobOrder | null {
  const q = query.trim();
  if (!q) return null;

  const qLower = q.toLowerCase();
  const qCompact = q.replace(/-/g, "").toUpperCase();

  const exactUuid = jobs.find(
    (job) => job.id === q || job.id.toLowerCase() === qLower,
  );
  if (exactUuid) return exactUuid;

  const shortMatches = jobs.filter((job) => {
    const short = shortJobId(job.id);
    return short === qCompact || short.startsWith(qCompact);
  });
  if (shortMatches.length === 1) return shortMatches[0];

  const exactLabel = jobs.find(
    (job) => formatJobOptionLabel(job).toLowerCase() === qLower,
  );
  if (exactLabel) return exactLabel;

  const partialLabel = jobs.filter((job) =>
    formatJobOptionLabel(job).toLowerCase().includes(qLower),
  );
  if (partialLabel.length === 1) return partialLabel[0];

  return null;
}

export type ClientJobRequestSelectHandle = {
  commitPending: () => boolean;
};

type ClientJobRequestSelectProps = {
  id?: string;
  value: string;
  onChange: (jobId: string) => void;
  jobs: JobOrder[];
  disabled?: boolean;
  compact?: boolean;
  placeholder?: string;
  className?: string;
  showValidationToast?: boolean;
  "aria-label"?: string;
};

export const ClientJobRequestSelect = React.forwardRef<
  ClientJobRequestSelectHandle,
  ClientJobRequestSelectProps
>(function ClientJobRequestSelect(
  {
    id,
    value,
    onChange,
    jobs,
    disabled = false,
    compact = false,
    placeholder = "Search or enter request ID…",
    className,
    showValidationToast = true,
    "aria-label": ariaLabel = "Related request",
  },
  ref,
) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputText, setInputText] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const selectedJob = React.useMemo(
    () => jobs.find((job) => job.id === value),
    [jobs, value],
  );

  const displayValue = open
    ? inputText
    : selectedJob
      ? formatJobOptionLabel(selectedJob)
      : "";

  const filteredJobs = React.useMemo(() => {
    const query = inputText.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter((job) => {
      const label = formatJobOptionLabel(job).toLowerCase();
      return (
        label.includes(query) ||
        job.id.toLowerCase().includes(query) ||
        shortJobId(job.id).toLowerCase().includes(query.replace(/-/g, ""))
      );
    });
  }, [jobs, inputText]);

  const listOptions = React.useMemo(
    () => [{ id: "", label: "No specific request" as const }, ...filteredJobs.map((job) => ({
      id: job.id,
      label: formatJobOptionLabel(job),
    }))],
    [filteredJobs],
  );

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [inputText, open]);

  React.useEffect(() => {
    if (!open) {
      syncInputToSelection();
    }
  }, [value, selectedJob, open]);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        syncInputToSelection();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, value, selectedJob]);

  function syncInputToSelection() {
    setInputText(selectedJob ? formatJobOptionLabel(selectedJob) : "");
  }

  function selectJob(jobId: string) {
    onChange(jobId);
    setOpen(false);
    if (jobId) {
      const job = jobs.find((item) => item.id === jobId);
      setInputText(job ? formatJobOptionLabel(job) : "");
    } else {
      setInputText("");
    }
  }

  function commitPending(): boolean {
    const query = inputText.trim();
    if (!query) {
      onChange("");
      setInputText("");
      setOpen(false);
      return true;
    }

    const resolved = resolveJobFromQuery(jobs, query);
    if (resolved) {
      onChange(resolved.id);
      setInputText(formatJobOptionLabel(resolved));
      setOpen(false);
      return true;
    }

    if (showValidationToast) {
      toast.error("Select a request from the list or enter a valid request ID.");
    }
    syncInputToSelection();
    setOpen(false);
    return false;
  }

  React.useImperativeHandle(ref, () => ({
    commitPending,
  }));

  function onInputFocus() {
    if (disabled) return;
    setOpen(true);
    setInputText(
      selectedJob ? formatJobOptionLabel(selectedJob) : inputText,
    );
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      syncInputToSelection();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((index) =>
        Math.min(index + 1, Math.max(listOptions.length - 1, 0)),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = listOptions[highlightedIndex];
      if (option) {
        selectJob(option.id);
        return;
      }
      commitPending();
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          id={id}
          value={displayValue}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          className={cn("pr-16", compact && "h-8 text-xs")}
          onFocus={onInputFocus}
          onChange={(event) => {
            setInputText(event.target.value);
            setOpen(true);
            if (!event.target.value.trim()) {
              onChange("");
            }
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                commitPending();
              }
            }, 0);
          }}
          onKeyDown={onInputKeyDown}
        />
        {value && !disabled ? (
          <button
            type="button"
            className={cn(
              "absolute right-8 rounded-sm p-1 text-muted-foreground hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
            aria-label="Clear request"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selectJob("")}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          className={cn(
            "absolute right-1 rounded-sm p-1 text-muted-foreground hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            disabled && "pointer-events-none opacity-50",
          )}
          aria-label="Show requests"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (disabled) return;
            setOpen((current) => !current);
            inputRef.current?.focus();
          }}
        >
          <ChevronDown className="size-4" aria-hidden />
        </button>
      </div>

      {open && !disabled ? (
        <div
          className={cn(
            "absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover shadow-md",
            compact && "text-xs",
          )}
          role="listbox"
        >
          <ul>
            {listOptions.length === 0 ? (
              <li className="px-3 py-2 text-muted-foreground">No requests found.</li>
            ) : (
              listOptions.map((option, index) => {
                const isSelected = option.id === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li key={option.id || "none"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex w-full px-3 py-2 text-left hover:bg-muted/60",
                        isSelected && "bg-muted/40 font-medium",
                        isHighlighted && "bg-muted/60",
                        option.id === "" && "text-muted-foreground",
                      )}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectJob(option.id)}
                    >
                      {option.id === "" ? option.label : option.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
});
