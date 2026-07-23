import { Link, useParams } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CmsPageSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { useEvent } from "@/features/cms/hooks";
import { ROUTES } from "@/lib/routing";

import { MarketingArticleBody } from "./components/marketing-article-body";
import { MarketingBreadcrumbs } from "./components/marketing-breadcrumbs";
import { MarketingPageShell } from "./components/marketing-page-shell";
import { MarketingFadeInView } from "./components/motion";

export function EventDetailPage() {
  const { slug = "" } = useParams();
  const { data: event, isLoading, isError, refetch } = useEvent(slug);

  if (isLoading) {
    return <CmsPageSkeleton lines={6} />;
  }

  if (isError) {
    return <CmsUnavailablePanel onRetry={() => void refetch()} />;
  }

  if (!event) {
    return (
      <MarketingPageShell>
        <h1 className="text-2xl font-semibold">Event not found</h1>
        <p className="mt-2 text-muted-foreground">
          This event page is not available.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to={ROUTES.events}>Back to events</Link>
        </Button>
      </MarketingPageShell>
    );
  }

  return (
    <MarketingPageShell>
      <MarketingBreadcrumbs
        items={[
          { label: "Events", href: ROUTES.events },
          { label: event.title },
        ]}
      />
      <article>
        <MarketingFadeInView>
          <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {event.status}
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{event.date}</span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" aria-hidden />
              {event.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-4" aria-hidden />
              {event.location}
            </span>
          </div>
          <p className="mt-6 text-lg text-muted-foreground">{event.description}</p>
          <div className="mt-8">
            <MarketingArticleBody paragraphs={event.body} />
          </div>
        </MarketingFadeInView>
      </article>
      <Button asChild className="mt-10" variant="outline">
        <Link to={ROUTES.events}>Back to all events</Link>
      </Button>
    </MarketingPageShell>
  );
}
