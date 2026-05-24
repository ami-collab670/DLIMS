import type { ReactNode } from "react";

export function SignupPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-sm text-muted-foreground">
            External client registration for LSIMS.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
