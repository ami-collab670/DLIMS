import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  CmsPageSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import { useNewsArticle } from "@/features/cms/hooks";
import { ROUTES } from "@/lib/routing";

import { MarketingArticleBody } from "./components/marketing-article-body";
import { MarketingBreadcrumbs } from "./components/marketing-breadcrumbs";
import { MarketingPageShell } from "./components/marketing-page-shell";
import { MarketingFadeInView } from "./components/motion";

export function NewsDetailPage() {
  const { slug = "" } = useParams();
  const { data: article, isLoading, isError, refetch } = useNewsArticle(slug);

  if (isLoading) {
    return <CmsPageSkeleton lines={6} />;
  }

  if (isError) {
    return <CmsUnavailablePanel onRetry={() => void refetch()} />;
  }

  if (!article) {
    return (
      <MarketingPageShell>
        <h1 className="text-2xl font-semibold">Article not found</h1>
        <p className="mt-2 text-muted-foreground">
          This news article is not available.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to={ROUTES.news}>Back to news</Link>
        </Button>
      </MarketingPageShell>
    );
  }

  return (
    <MarketingPageShell>
      <MarketingBreadcrumbs
        items={[{ label: "News", href: ROUTES.news }, { label: article.title }]}
      />
      <article>
        <MarketingFadeInView>
          <p className="text-sm text-muted-foreground">
            {article.date} · {article.category}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {article.title}
          </h1>
          <div className="mt-8">
            <MarketingArticleBody paragraphs={article.body} />
          </div>
        </MarketingFadeInView>
      </article>
      <Button asChild className="mt-10" variant="outline">
        <Link to={ROUTES.news}>Back to all news</Link>
      </Button>
    </MarketingPageShell>
  );
}
