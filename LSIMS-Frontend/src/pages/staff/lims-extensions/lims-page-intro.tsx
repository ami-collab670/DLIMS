import type { ReactNode } from "react";

export function LimsPageIntro({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
