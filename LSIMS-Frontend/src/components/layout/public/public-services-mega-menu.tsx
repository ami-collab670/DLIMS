import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resolveCmsIcon } from "@/features/cms/icon-map";
import type { ServiceItem } from "@/features/cms/types";
import { ROUTES } from "@/lib/routing";

export function PublicServicesMegaMenu({
  services,
  eyebrow,
  title,
  description,
  onNavigate,
}: {
  services: ServiceItem[];
  eyebrow: string;
  title: string;
  description: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr] md:gap-6">
        <div className="relative overflow-hidden rounded-xl bg-foreground p-6 text-background">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/85"
            aria-hidden
          />
          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-background/70">
                {eyebrow}
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-background/85">
                {description}
              </p>
            </div>
            <Button asChild variant="secondary" size="sm" className="w-fit">
              <Link to={ROUTES.services.root} onClick={onNavigate}>
                View all services
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        <ul className="grid gap-1 sm:grid-cols-2">
          {services.map((service) => {
            const Icon = resolveCmsIcon(service.iconKey);
            return (
              <li key={service.slug}>
                <Link
                  to={service.href}
                  onClick={onNavigate}
                  className="group flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-background">
                    <Icon
                      className="size-5 text-muted-foreground group-hover:text-primary"
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium group-hover:text-primary">
                      {service.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {service.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
