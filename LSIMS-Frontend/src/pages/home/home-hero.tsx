import { useHomePage } from "@/features/cms/hooks";
import { DEFAULT_HOME_PAGE } from "@/features/cms/defaults";

export function HomeHero() {
  const { data, isLoading } = useHomePage();
  const content = data ?? DEFAULT_HOME_PAGE;

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 w-3/4 rounded bg-muted" />
        <div className="h-16 w-full rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {content.heroTitle}
      </h1>
      <p className="text-muted-foreground">{content.heroSubtitle}</p>
    </div>
  );
}
