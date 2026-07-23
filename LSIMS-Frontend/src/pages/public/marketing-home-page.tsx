import { useAuthStore } from "@/stores/auth-store";

import { MarketingCtaBanner } from "./marketing-cta-banner";
import { MarketingEventsSection } from "./marketing-events-section";
import { MarketingHeroSection } from "./marketing-hero-section";
import { MarketingNewsSection } from "./marketing-news-section";
import { MarketingPartnersStrip } from "./marketing-partners-strip";
import { MarketingServicesSection } from "./marketing-services-section";
import { MarketingStatsSection } from "./marketing-stats-section";

export function MarketingHomePage() {
  const { user, ready } = useAuthStore();

  return (
    <div className="flex flex-1 flex-col">
      <MarketingHeroSection user={user} ready={ready} />
      <MarketingServicesSection />
      <MarketingStatsSection />
      <MarketingNewsSection />
      <MarketingEventsSection />
      <MarketingCtaBanner user={user} ready={ready} />
      <MarketingPartnersStrip />
    </div>
  );
}
