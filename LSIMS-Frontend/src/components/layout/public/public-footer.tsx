import { Link } from "react-router-dom";
import { Globe, Mail, Share2 } from "lucide-react";

import { APP_NAME_FALLBACK } from "@/features/cms/defaults";
import { useSiteSettings } from "@/features/cms/hooks";
import { ROUTES } from "@/lib/routing";

const SOCIAL_ICONS = {
  linkedin: Share2,
  twitter: Globe,
  youtube: Mail,
} as const;

export function PublicFooter() {
  const { data: siteSettings, isLoading, isError } = useSiteSettings();
  const siteName = siteSettings?.siteName ?? (isLoading ? "…" : APP_NAME_FALLBACK);
  const year = new Date().getFullYear();

  if (isError || (!isLoading && !siteSettings)) {
    return (
      <footer className="mt-auto border-t border-border bg-foreground text-background/80">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm">
          Footer content is temporarily unavailable.
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-border bg-foreground text-background/80">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-4 md:py-12">
        <div className="flex flex-col gap-3">
          <Link
            to={ROUTES.home}
            className="text-lg font-semibold text-background hover:opacity-90"
          >
            {siteName}
          </Link>
          {siteSettings?.footerTagline ? (
            <p className="text-sm leading-relaxed">{siteSettings.footerTagline}</p>
          ) : null}
        </div>

        {(siteSettings?.footerLinkGroups ?? []).map((group) => (
          <div key={group.id}>
            <h3 className="mb-4 text-sm font-semibold text-background">
              {group.title}
            </h3>
            <ul className="space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-background/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 text-sm md:flex-row">
          <div className="flex gap-4">
            {(siteSettings?.socialLinks ?? []).map((social) => {
              const Icon =
                SOCIAL_ICONS[social.platformId as keyof typeof SOCIAL_ICONS] ??
                Share2;
              return (
                <a
                  key={social.platformId}
                  href={social.href}
                  aria-label={social.label}
                  className="transition-colors hover:text-background"
                >
                  <Icon className="size-5" aria-hidden />
                </a>
              );
            })}
          </div>
          <p className="text-center opacity-80">
            © {year} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
