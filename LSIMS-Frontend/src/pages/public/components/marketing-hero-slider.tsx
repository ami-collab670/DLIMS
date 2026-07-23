import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

import type { HeroSlide } from "@/features/cms/types";
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
  usePrefersReducedMotion,
} from "./motion";

/** Autoplay interval between hero slides (ms). Pauses on hover/focus. */
const AUTO_ADVANCE_MS = 7_000;

export type HeroSlideCta = {
  label: string;
  href: string;
};

type MarketingHeroSliderProps = {
  slides: HeroSlide[];
  ready: boolean;
  getPrimaryCta: (slide: HeroSlide) => HeroSlideCta | null;
  getSecondaryCta: (slide: HeroSlide) => HeroSlideCta | null;
};

function HeroSlideBackground({
  slide,
  isActive,
  prefersReducedMotion,
}: {
  slide: HeroSlide;
  isActive: boolean;
  prefersReducedMotion: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [slide.imageSrc]);

  const showImage = !imageFailed;

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-700 ease-in-out",
        isActive ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!isActive}
    >
      <div className={cn("absolute inset-0", slide.gradientFallbackClass)} />
      {showImage ? (
        <img
          src={slide.imageSrc}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover",
            isActive && !prefersReducedMotion && "hero-ken-burns",
          )}
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
    </div>
  );
}

function HeroSlideText({
  slide,
  ready,
  primaryCta,
  secondaryCta,
  prefersReducedMotion,
}: {
  slide: HeroSlide;
  ready: boolean;
  primaryCta: HeroSlideCta | null;
  secondaryCta: HeroSlideCta | null;
  prefersReducedMotion: boolean;
}) {
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: fadeUpHidden,
        animate: fadeUpVisible,
        exit: fadeUpHidden,
        transition: fadeUpTransition(),
      };

  return (
    <motion.div key={slide.id} aria-live="polite">
      <motion.h1
        {...motionProps}
        transition={fadeUpTransition(0)}
        className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-background sm:text-5xl"
      >
        {slide.title}
      </motion.h1>
      <motion.p
        {...motionProps}
        transition={fadeUpTransition(0.08)}
        className="mt-6 max-w-2xl text-base leading-relaxed text-background/85 sm:text-lg"
      >
        {slide.subtitle}
      </motion.p>

      {ready && (primaryCta || secondaryCta) ? (
        <motion.div
          {...motionProps}
          transition={fadeUpTransition(0.16)}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4"
        >
          {primaryCta ? (
            <Button asChild size="lg" variant="secondary">
              <Link to={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
          {secondaryCta ? (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background/30 bg-background/10 text-background hover:bg-background/20 hover:text-background"
            >
              <Link to={secondaryCta.href}>
                {secondaryCta.href.startsWith("/services") ? (
                  <Briefcase className="size-4" aria-hidden />
                ) : (
                  <ArrowRight className="size-4" aria-hidden />
                )}
                {secondaryCta.label}
              </Link>
            </Button>
          ) : null}
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export function MarketingHeroSlider({
  slides,
  ready,
  getPrimaryCta,
  getSecondaryCta,
}: MarketingHeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const slideCount = slides.length;
  const activeSlide = slides[activeIndex] ?? slides[0];

  const goToSlide = useCallback(
    (index: number) => {
      if (slideCount === 0) return;
      setActiveIndex(((index % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => {
    if (slideCount === 0) return;
    setActiveIndex((current) => (current + 1) % slideCount);
  }, [slideCount]);

  const goPrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  useEffect(() => {
    if (slideCount <= 1 || isPaused || prefersReducedMotion) return;

    const timer = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isPaused, prefersReducedMotion, slideCount]);

  if (!activeSlide) return null;

  const primaryCta = getPrimaryCta(activeSlide);
  const secondaryCta = getSecondaryCta(activeSlide);

  return (
    <section
      className="relative h-[80vh] min-h-[480px] overflow-hidden bg-foreground"
      role="region"
      aria-roledescription="carousel"
      aria-label="Homepage hero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
    >
      {slides.map((slide, index) => (
        <HeroSlideBackground
          key={slide.id}
          slide={slide}
          isActive={index === activeIndex}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}

      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:py-24">
          <AnimatePresence mode="wait">
            <HeroSlideText
              key={activeSlide.id}
              slide={activeSlide}
              ready={ready}
              primaryCta={primaryCta}
              secondaryCta={secondaryCta}
              prefersReducedMotion={prefersReducedMotion}
            />
          </AnimatePresence>
        </div>
      </div>

      {slideCount > 1 ? (
        <>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  className={cn(
                    "rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                    isActive
                      ? "h-2.5 w-8 bg-background"
                      : "size-2.5 bg-background/40 hover:bg-background/70",
                  )}
                  aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => goToSlide(index)}
                />
              );
            })}
          </div>

          <div className="absolute bottom-6 right-4 z-20 hidden items-center gap-2 sm:flex sm:right-8">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full border border-background/20 bg-background/10 text-background backdrop-blur-sm transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
              aria-label="Previous slide"
              onClick={goPrev}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full border border-background/20 bg-background/10 text-background backdrop-blur-sm transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
              aria-label="Next slide"
              onClick={goNext}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
