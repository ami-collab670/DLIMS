import { useHomePage } from "@/features/cms/hooks";

export function HomeHero() {
  const { data, isLoading, isError } = useHomePage();
  const slide = data?.heroSlides[0];

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 w-3/4 rounded bg-muted" />
        <div className="h-16 w-full rounded bg-muted" />
      </div>
    );
  }

  if (isError || !slide) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {slide.title}
      </h1>
      <p className="text-muted-foreground">{slide.subtitle}</p>
    </div>
  );
}
