import type { ReactNode } from "react";

import {
  CmsPageSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import type { ContactPageContent } from "@/features/cms/types";
import { ROUTES } from "@/lib/routing";
import { usePublicLocale } from "@/providers/locale-provider";

import { MarketingContactDetails } from "@/pages/public/components/marketing-contact-details";
import { MarketingPageHero } from "@/pages/public/components/marketing-page-hero";
import { MarketingPageShell } from "@/pages/public/components/marketing-page-shell";
import { MarketingSubnavTabs } from "@/pages/public/components/marketing-subnav-tabs";

const CONTACT_TAB_ROUTES = [
  { slug: "main", href: ROUTES.contact.root },
  { slug: "collection-points", href: ROUTES.contact.collectionPoints },
  { slug: "careers", href: ROUTES.contact.careers },
] as const;

export function ContactPageLayout({
  content,
  tabLabels,
  isLoading,
  isError,
  onRetry,
  children,
}: {
  content: ContactPageContent | undefined;
  tabLabels: Record<string, string>;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  const { localizePath } = usePublicLocale();

  if (isLoading) {
    return <CmsPageSkeleton lines={6} />;
  }

  if (isError || !content) {
    return <CmsUnavailablePanel onRetry={onRetry} />;
  }

  const tabs = CONTACT_TAB_ROUTES.map((tab) => ({
    label: tabLabels[tab.slug] ?? tab.slug,
    href: localizePath(tab.href),
  }));

  return (
    <div className="flex flex-1 flex-col pb-12">
      <MarketingPageHero
        title={content.heroTitle}
        subtitle={content.heroSubtitle}
      />
      <MarketingSubnavTabs tabs={tabs} />
      <MarketingPageShell>
        <MarketingContactDetails intro={content.intro} details={content.details} />
        {children}
      </MarketingPageShell>
    </div>
  );
}
