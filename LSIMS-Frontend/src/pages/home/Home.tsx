import { useAuthStore } from "@/stores/auth-store";

import { HomeAuthActions } from "./home-auth-actions";
import { HomeHero } from "./home-hero";

export default function Home() {
  const { user, ready } = useAuthStore();

  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <HomeHero />
      <HomeAuthActions user={user} ready={ready} />
    </div>
  );
}
