import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ErrorPageShellProps = {
  children: ReactNode;
  embedded?: boolean;
};

export function ErrorPageShell({ children, embedded = false }: ErrorPageShellProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center",
        embedded
          ? "min-h-[min(28rem,calc(100dvh-7rem))] py-8"
          : "min-h-[calc(100dvh-3.5rem)] flex-1 px-4 py-10 sm:px-6",
      )}
    >
      <div
        className={cn(
          "w-full max-w-lg overflow-hidden  ",
          // "ring-1 ring-border/60",
        )}
        role="alert"
        aria-live="polite"
      >
        {/* <div className="h-1 bg-primary" aria-hidden /> */}
        <div className="px-8 py-10 sm:px-10">{children}</div>
      </div>
    </div>
  );
}
