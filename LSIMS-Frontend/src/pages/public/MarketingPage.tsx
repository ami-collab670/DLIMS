import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useMarketingPage } from "@/features/cms/hooks";

import { CmsPageShell } from "./cms-page-shell";
import { MarketingPageContent } from "./marketing-page-content";

export function MarketingPage({ slug }: { slug: string }) {
  const { data: page, isLoading, isError } = useMarketingPage(slug);

  if (isLoading) {
    return (
      <CmsPageShell>
        <div className="space-y-3 animate-pulse">
          <div className="h-9 w-2/3 rounded bg-muted" />
          <div className="h-5 w-full rounded bg-muted" />
          <div className="h-24 w-full rounded bg-muted" />
        </div>
      </CmsPageShell>
    );
  }

  if (isError) {
    return (
      <CmsPageShell>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Content unavailable
          </h1>
          <p className="text-muted-foreground">
            We could not load this page from the CMS. Try again later or return
            home.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </CmsPageShell>
    );
  }

  if (!page) {
    return (
      <CmsPageShell>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground">
            This page is not available yet. Check back later or return home.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </CmsPageShell>
    );
  }

  return (
    <CmsPageShell>
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {page.title}
          </h1>
          {page.intro ? (
            <p className="text-lg text-muted-foreground">{page.intro}</p>
          ) : null}
        </div>
        <MarketingPageContent body={page.body} />
      </div>
    </CmsPageShell>
  );
}
