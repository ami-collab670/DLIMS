import { useAboutPage, useHomePage, usePartners } from "@/features/cms/hooks";

import { MarketingPartnersMarquee } from "./components/marketing-partners-marquee";

export function MarketingPartnersStrip({
  variant = "home",
}: {
  variant?: "home" | "about";
}) {
  const homePage = useHomePage();
  const aboutPage = useAboutPage();
  const partners = usePartners();

  const header =
    variant === "about"
      ? (aboutPage.data?.partnersHeader ?? null)
      : (homePage.data?.partnersHeader ?? null);

  const isLoading =
    partners.isLoading ||
    (variant === "about" ? aboutPage.isLoading : homePage.isLoading);

  const isError =
    partners.isError ||
    (variant === "about" ? aboutPage.isError : homePage.isError) ||
    !header;

  return (
    <MarketingPartnersMarquee
      variant={variant}
      header={header}
      partners={partners.data ?? []}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => {
        void partners.refetch();
        if (variant === "about") {
          void aboutPage.refetch();
        } else {
          void homePage.refetch();
        }
      }}
    />
  );
}
