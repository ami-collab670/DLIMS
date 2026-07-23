import type { ReactNode } from "react";

export function MarketingPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12">
      {children}
    </div>
  );
}
