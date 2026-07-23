import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MarketingSectionHeader({
  eyebrow,
  title,
  titleId,
  actionLabel,
  actionHref,
}: {
  eyebrow: string;
  title: string;
  titleId: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h2
          id={titleId}
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {title}
        </h2>
        <div className="mt-1 h-1 w-16 rounded-full bg-primary" aria-hidden />
      </div>
      {actionLabel && actionHref ? (
        <Button asChild size="sm" className="w-fit shrink-0">
          <Link to={actionHref}>
            {actionLabel}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
