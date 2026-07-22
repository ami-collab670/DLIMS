import type { ReactNode } from "react";

import { cn } from "@/lib/ui";

type TableColumnFilterSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
  className?: string;
  children: ReactNode;
};

export function TableColumnFilterSelect({
  id,
  value,
  onChange,
  "aria-label": ariaLabel,
  className,
  children,
}: TableColumnFilterSelectProps) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs shadow-sm",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </select>
  );
}
