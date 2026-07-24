import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CmsPageSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { resolveCmsIcon } from "@/features/cms/icon-map";
import { useService } from "@/features/cms/hooks";
import { ROUTES } from "@/lib/routing";
import { usePublicLocale } from "@/providers/locale-provider";

import { MarketingArticleBody } from "./components/marketing-article-body";
import { MarketingBreadcrumbs } from "./components/marketing-breadcrumbs";
import { MarketingPageHero } from "./components/marketing-page-hero";
import { MarketingPageShell } from "./components/marketing-page-shell";
import { MarketingFadeInView } from "./components/motion";

export function ServiceDetailPage() {
  const { slug = "" } = useParams();
  const { localizePath } = usePublicLocale();
  const { data: service, isLoading, isError, refetch } = useService(slug);

  if (isLoading) {
    return <CmsPageSkeleton lines={6} />;
  }

  if (isError) {
    return <CmsUnavailablePanel onRetry={() => void refetch()} />;
  }

  if (!service) {
    return (
      <MarketingPageShell>
        <h1 className="text-2xl font-semibold">Service not found</h1>
        <p className="mt-2 text-muted-foreground">
          The requested service page does not exist.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to={localizePath(ROUTES.services.root)}>Back to services</Link>
        </Button>
      </MarketingPageShell>
    );
  }

  const Icon = resolveCmsIcon(service.iconKey);

  return (
    <div className="flex flex-1 flex-col">
      <MarketingPageHero
        title={service.title}
        subtitle={service.description}
        icon={Icon}
      />
      <MarketingPageShell>
        <MarketingBreadcrumbs
          items={[
            { label: "Services", href: localizePath(ROUTES.services.root) },
            { label: service.title },
          ]}
        />
        <MarketingFadeInView>
          <MarketingArticleBody paragraphs={[service.longDescription]} />
          <ul className="mt-8 space-y-2">
            {service.highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {highlight}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link to={ROUTES.signup}>
                Get started
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={localizePath(ROUTES.contact.root)}>Contact us</Link>
            </Button>
          </div>
        </MarketingFadeInView>
      </MarketingPageShell>
    </div>
  );
}
