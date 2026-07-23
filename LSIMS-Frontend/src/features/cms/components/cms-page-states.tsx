import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CmsPageSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-4 px-4 py-12">
      <div className="h-8 w-48 rounded bg-muted" />
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-4 w-full max-w-2xl rounded bg-muted" />
      ))}
    </div>
  );
}

export function CmsSectionSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-16">
      <div className="h-6 w-32 rounded bg-muted" />
      <div className="mt-4 h-10 w-64 rounded bg-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function CmsHeroSkeleton() {
  return (
    <section className="relative flex h-[80vh] min-h-[480px] items-center bg-muted animate-pulse">
      <div className="mx-auto w-full max-w-7xl px-4 py-20">
        <div className="h-8 w-48 rounded bg-background/60" />
        <div className="mt-6 h-12 w-3/4 max-w-xl rounded bg-background/60" />
        <div className="mt-4 h-20 w-full max-w-2xl rounded bg-background/60" />
      </div>
    </section>
  );
}

export function CmsUnavailablePanel({
  title = "Content temporarily unavailable",
  description = "Marketing content could not be loaded from the CMS. Please try again shortly.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center"
    >
      <AlertCircle className="size-10 text-muted-foreground" aria-hidden />
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
