import type { ReactNode } from "react";

export function LoginPageLayout({
  children,
  title = "Sign in",
  description = "Use your LSIMS account email and password.",
}: {
  children: ReactNode;
  title?: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
