import { APP_NAME_FALLBACK } from "@/features/cms/defaults";
import {
  AUTH_PAGE_DEFAULTS,
  getAuthBrandCopy,
  type AuthBrandVariant,
} from "@/features/cms/auth-defaults";
import { resolveCmsIcon } from "@/features/cms/icon-map";
import { useAuthPageContent } from "@/features/cms/hooks/use-auth-page";
import { useSiteSettings } from "@/features/cms/hooks";
import { cn } from "@/lib/ui/cn";

export type { AuthBrandVariant };

export function AuthBrandPanel({ variant }: { variant: AuthBrandVariant }) {
  const { data: siteSettings } = useSiteSettings();
  const authPage = useAuthPageContent();
  const siteName = siteSettings?.siteName ?? APP_NAME_FALLBACK;
  const copy = getAuthBrandCopy(authPage, variant);
  const trustBullets =
    authPage.trustBullets.length > 0
      ? authPage.trustBullets
      : AUTH_PAGE_DEFAULTS.trustBullets;

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col justify-between overflow-hidden bg-foreground p-8 xl:p-12 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:max-h-dvh lg:w-[45%] xl:w-[42%]",
      )}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/85"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-muted)_0%,_transparent_55%)] opacity-15"
        aria-hidden
      />

      <div className="relative z-10">
        <p className="text-sm font-medium text-background/70">{copy.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-background xl:text-4xl">
          {siteName}
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-background/85">
          {copy.tagline}
        </p>
      </div>

      <ul className="relative z-10 space-y-5">
        {trustBullets.map((bullet) => {
          const Icon = resolveCmsIcon(bullet.iconKey);
          return (
            <li key={bullet.title} className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-background/20 bg-background/10 text-background">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium text-background">{bullet.title}</p>
                <p className="mt-0.5 text-sm text-background/75">
                  {bullet.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
