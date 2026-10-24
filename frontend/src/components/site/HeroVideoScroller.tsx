import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles, Wrench } from "lucide-react";
import electronicsHero from "@/assets/imgs/hero-electronics-showcase.png";
import repairHero from "@/assets/imgs/hero-repair-workbench.png";
import { BUSINESS_WHATSAPP_NUMBER } from "@/lib/config";
import { useSettings } from "@/context/settings";

/* WhatsApp SVG icon */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const SLIDES = [
  {
    id: "tv-showcase",
    poster: electronicsHero,
    badge: "SMART HOME ENTERTAINMENT",
    badgeIcon: Sparkles,
    title: "Cinematic 4K QLED & Smart Displays",
    description:
      "Immerse yourself in vivid color clarity, Dolby Atmos audio, and ultra-thin bezel designs from top global brands.",
    primaryCta: { text: "Shop TVs & Projectors", to: "/shop" as const, search: { category: "tv" } },
    secondaryCta: {
      text: "View New Arrivals",
      to: "/shop" as const,
      search: { sort: "newest" as const },
    },
  },
  {
    id: "repair-components",
    poster: repairHero,
    badge: "GENUINE ELECTRONICS & REPAIR",
    badgeIcon: Wrench,
    title: "Precision Parts & Component Repair",
    description:
      "Certified semiconductors, capacitors, controller boards, and professional soldering equipment for technicians across Sri Lanka.",
    primaryCta: {
      text: "Browse Components",
      to: "/shop" as const,
      search: { category: "components" },
    },
    whatsappCta: {
      text: "WhatsApp Parts Inquiry",
      url: `https://web.whatsapp.com/send?phone=${BUSINESS_WHATSAPP_NUMBER}&text=${encodeURIComponent(
        "Hello Asia Electronics, I would like to inquire about television and circuit repair parts availability.",
      )}`,
    },
  },
];

export function HeroVideoScroller() {
  const { buildWhatsAppUrl } = useSettings();
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay progression timer
  useEffect(() => {
    if (!isPlaying) return;

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
          {SLIDES.map((slide, idx) => {
            const isActive = idx === current;
            const BadgeIcon = slide.badgeIcon;
            return (
              <div
                key={slide.id}
                className="relative h-full w-full min-w-full shrink-0 overflow-hidden"
              >
                {/* Background Video with Poster fallback */}
                <motion.img
                  src={slide.poster}
                  alt=""
                  initial={{ scale: 1.06 }}
                  animate={isActive ? { scale: 1 } : { scale: 1.06 }}
                  transition={{ duration: 6.5, ease: "easeOut" }}
                  className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.78] contrast-[1.05]"
                />

                {/* Rich dark gradient overlay for crystal-clear readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent sm:via-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                {/* Slide Content */}
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-20 flex h-full max-w-2xl flex-col justify-center px-5 py-8 text-white sm:px-12 sm:py-12 lg:px-16"
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

                    {slide.whatsappCta ? (
                      <a
                        href={buildWhatsAppUrl(
                          "Hello Asia Electronics, I would like to inquire about television and circuit repair parts availability.",
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 rounded bg-[#25D366] px-3 py-2 text-[10px] sm:gap-2 sm:px-5 sm:py-3 sm:text-sm text-white font-display font-bold uppercase tracking-wider transition-all hover:bg-[#20ba5a] hover:scale-102 shadow-md"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                        <span className="sm:hidden">WhatsApp</span>
                        <span className="hidden sm:inline">{slide.whatsappCta.text}</span>
                      </a>
                    ) : (
                      slide.secondaryCta && (
                        <Link
                          to={slide.secondaryCta.to}
                          search={slide.secondaryCta.search}
                          className="inline-flex w-auto shrink-0 items-center justify-center rounded border-2 px-3 py-2 text-[10px] sm:px-6 sm:py-3 sm:text-sm border-white/80 bg-black/40 text-white font-display font-bold uppercase tracking-wider backdrop-blur-xs transition-all hover:bg-white hover:text-black hover:scale-102 shadow-md"
                        >
                          {slide.secondaryCta.text}
                        </Link>
                      )
                    )}
                  </div>
                </motion.div>
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
            {SLIDES.map((_, i) => (
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
