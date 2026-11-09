import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles } from "lucide-react";
import { useSettings } from "@/context/settings";

export function HeroVideoScroller() {
  const { settings } = useSettings();
  const slides = (settings.homepageBanners ?? []).map((banner) => ({
        id: banner.id,
        poster: banner.image,
        mobilePoster: banner.image,
        badge: banner.badge,
        badgeIcon: Sparkles,
        title: banner.title,
        description: banner.description,
        primaryCta: { text: banner.buttonText, to: "/shop" as const, search: { category: banner.category } },
        secondaryCta: banner.secondaryButtonText && banner.secondaryButtonUrl
          ? { text: banner.secondaryButtonText, url: banner.secondaryButtonUrl }
          : undefined,
      }));
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay progression timer
  useEffect(() => {
    if (!isPlaying || totalSlides <= 1) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, nextSlide]);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (totalSlides === 0) return null;

  return (
    <section
      className="container-shop pt-4 sm:pt-6"
      aria-label="Featured product banners"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-[240px] w-full overflow-hidden rounded-md border border-zinc-800 bg-black shadow-xl sm:h-[440px] lg:h-[500px]">
        {/* Horizontal Slider Track */}
        <div
          className="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide, idx) => {
            const isActive = idx === current;
            const BadgeIcon = slide.badgeIcon;
            return (
              <div
                key={slide.id}
                className="relative h-full w-full min-w-full shrink-0 overflow-hidden"
              >
                {/* Background Video with Poster fallback */}
                <picture>
                  <source media="(max-width: 639px)" srcSet={slide.mobilePoster} />
                  <img
                    src={slide.poster}
                    alt=""
                    width={1600}
                    height={900}
                    sizes="100vw"
                    loading={idx === 0 ? "eager" : "lazy"}
                    fetchPriority={idx === 0 ? "high" : "low"}
                    decoding="async"
                    className={`absolute inset-0 h-full w-full object-cover object-center brightness-[0.78] contrast-[1.05] transition-transform duration-[6500ms] ease-out motion-reduce:transition-none ${isActive ? "scale-100" : "scale-[1.06]"}`}
                  />
                </picture>

                {/* Rich dark gradient overlay for crystal-clear readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent sm:via-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                {/* Slide Content */}
                <div
                  className={`relative z-20 flex h-full max-w-2xl flex-col justify-center px-5 py-8 text-white transition-all duration-500 motion-reduce:transition-none sm:px-12 sm:py-12 lg:px-16 ${isActive ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
                >
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm w-fit mb-2 sm:mb-4">
                    <BadgeIcon className="h-3.5 w-3.5" />
                    <span>{slide.badge}</span>
                  </div>

                  {/* Heading */}
                  <h1 className="font-display text-lg sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight sm:leading-tight">
                    {slide.title}
                  </h1>

                  {/* Description */}
                  <p className="mt-2 hidden text-[11px] font-medium leading-relaxed text-zinc-200 sm:mt-4 sm:block sm:line-clamp-3 sm:text-sm lg:text-base">
                    {slide.description}
                  </p>

                  {/* CTAs */}
                  <div className="mt-4 flex flex-col items-start gap-2 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
                    <Link
                      to={slide.primaryCta.to}
                      search={slide.primaryCta.search}
                      className="inline-flex w-auto items-center justify-center rounded bg-primary px-3 py-2 text-[10px] leading-tight sm:px-6 sm:py-3 sm:text-sm text-primary-foreground font-display font-black uppercase tracking-wider transition-all hover:bg-primary/90 hover:scale-102 shadow-md"
                    >
                      {slide.primaryCta.text} →
                    </Link>

                    {slide.secondaryCta && (
                      <a href={slide.secondaryCta.url} className="inline-flex w-auto shrink-0 items-center justify-center rounded border-2 border-white/80 bg-transparent px-3 py-2 text-[10px] sm:px-6 sm:py-3 sm:text-sm text-white font-display font-bold uppercase tracking-wider transition-all hover:bg-white hover:text-zinc-950 hover:scale-102 shadow-md">
                        {slide.secondaryCta.text}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous banner"
          className="absolute left-4 top-1/2 z-30 grid h-8 w-8 -translate-y-1/2 place-items-center sm:h-11 sm:w-11 rounded-full bg-black/50 text-white border border-white/20 backdrop-blur-xs transition-all hover:bg-primary hover:border-primary cursor-pointer shadow-lg"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next banner"
          className="absolute right-4 top-1/2 z-30 grid h-8 w-8 -translate-y-1/2 place-items-center sm:h-11 sm:w-11 rounded-full bg-black/50 text-white border border-white/20 backdrop-blur-xs transition-all hover:bg-primary hover:border-primary cursor-pointer shadow-lg"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Bottom Slide Indicators & Pause/Play Control */}
        <div className="absolute bottom-3 inset-x-0 sm:bottom-4 z-30 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause autoplay" : "Start autoplay"}
            className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-xs hover:bg-black/90 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="h-2.5 w-2.5" />
            ) : (
              <Play className="h-2.5 w-2.5 ml-0.5" />
            )}
          </button>

          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === current ? "w-8 bg-primary shadow-sm" : "w-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
