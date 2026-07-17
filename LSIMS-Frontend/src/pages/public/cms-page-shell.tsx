import type { ReactNode } from "react";

export function CmsPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      {children}
    </div>
  );
}
