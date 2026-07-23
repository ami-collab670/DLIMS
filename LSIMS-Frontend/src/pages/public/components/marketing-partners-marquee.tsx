import type { CSSProperties } from "react";

import {
  CmsSectionSkeleton,
  CmsUnavailablePanel,
} from "@/features/cms/components/cms-page-states";
import type { PartnerItem, SectionHeader } from "@/features/cms/types";
import { cn } from "@/lib/ui";

import { MarketingSectionHeader } from "../marketing-section-header";
import { usePrefersReducedMotion } from "./motion/use-prefers-reduced-motion";

const LOGO_CARD_CLASSNAME =
  "rounded-xl border border-border bg-card px-5 py-3 shadow-sm transition-shadow hover:shadow-md motion-safe:hover:scale-[1.02] motion-safe:transition-transform";

const VARIANT_CONFIG = {
  home: {
    titleId: "marketing-partners-heading",
    sectionClassName: "border-t border-border bg-muted/30 py-16 sm:py-20",
    duration: "45s",
    reverse: false,
  },
  about: {
    titleId: "about-partners-heading",
    sectionClassName: "border-y border-border bg-muted/20 py-14 sm:py-16",
    duration: "38s",
    reverse: true,
  },
} as const;

function PartnerTile({
  partner,
  className,
}: {
  partner: PartnerItem;
  className: string;
}) {
  const tile = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        className,
        partner.href && "cursor-pointer",
      )}
    >
      <img
        src={partner.logoSrc}
        alt={partner.name}
        loading="lazy"
        className="h-12 w-auto max-w-[160px] object-contain"
      />
    </span>
  );

  if (partner.href) {
    return (
      <a
        href={partner.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${partner.name}`}
        className="shrink-0 no-underline"
      >
        {tile}
      </a>
    );
  }

  return tile;
}

export function MarketingPartnersMarquee({
  variant,
  header,
  partners,
  isLoading,
  isError,
  onRetry,
}: {
  variant: "home" | "about";
  header: SectionHeader | null;
  partners: PartnerItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const config = VARIANT_CONFIG[variant];

  if (isLoading) {
    return <CmsSectionSkeleton />;
  }

  if (isError || !header || !partners.length) {
    return <CmsUnavailablePanel onRetry={onRetry} />;
  }

  const marqueePartners = [...partners, ...partners];

  return (
    <section
      aria-labelledby={config.titleId}
      className={config.sectionClassName}
    >
      <div className="mx-auto max-w-7xl px-4">
        <MarketingSectionHeader
          eyebrow={header.eyebrow}
          title={header.title}
          titleId={config.titleId}
        />

        <div
          className="partners-marquee-mask overflow-hidden"
          aria-label="Partner organizations"
        >
          <div
            className={cn(
              "flex w-max gap-3",
              !prefersReducedMotion && "partners-marquee-track",
              !prefersReducedMotion &&
                config.reverse &&
                "partners-marquee-track--reverse",
              prefersReducedMotion && "mx-auto w-full flex-wrap justify-center",
            )}
            style={
              !prefersReducedMotion
                ? ({ "--marquee-duration": config.duration } as CSSProperties)
                : undefined
            }
          >
            {(prefersReducedMotion ? partners : marqueePartners).map(
              (partner, index) => (
                <PartnerTile
                  key={`${partner.id}-${index}`}
                  partner={partner}
                  className={LOGO_CARD_CLASSNAME}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
