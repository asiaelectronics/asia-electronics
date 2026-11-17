import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { CategoryProductCard, CategoryProductCardSkeleton } from "./CategoryProductCard";

interface CategoryProductSectionProps {
  category: Category;
  products: Product[];
  isLoading?: boolean;
}

export function CategoryProductSection({
  category,
  products,
  isLoading = false,
}: CategoryProductSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    slidesToScroll: "auto",
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect, products.length]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section
      className="container-shop py-4 sm:py-8"
      aria-labelledby={`cat-heading-${category.slug}`}
    >
      {/* ─── Section Header: Title on Left, VIEW ALL on Right ─── */}
      <div className="flex min-h-7 items-center justify-between gap-3">
        <h2
          id={`cat-heading-${category.slug}`}
          className="min-w-0 truncate font-display text-base font-bold tracking-tight text-foreground sm:text-lg lg:text-xl"
        >
          {category.name}
        </h2>
        <Link
          to="/shop"
          search={{ category: category.slug }}
          className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-primary transition-colors hover:underline sm:text-xs"
        >
          VIEW ALL
        </Link>
      </div>

      {/* Thin horizontal divider beneath heading */}
      <div className="mb-3 mt-1.5 border-b border-border/80 sm:mb-4 sm:mt-2" />

      {/* ─── Product Carousel Row with Prev/Next Controls ─── */}
      <div className="group/row relative">
        {/* Previous Navigation Arrow */}
        {canScrollPrev && (
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous products"
            className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-border bg-white text-foreground shadow-md transition-all hover:bg-tile hover:text-primary cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Next Navigation Arrow */}
        {canScrollNext && (
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next products"
            className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-border bg-white text-foreground shadow-md transition-all hover:bg-tile hover:text-primary cursor-pointer"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Carousel Viewport */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div
            className={`flex touch-pan-y gap-2 sm:gap-0 ${
              !isLoading && products.length === 1 ? "justify-center sm:justify-start" : ""
            }`}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="category-product-slide border border-border sm:border-r-0"
                  >
                    <CategoryProductCardSkeleton />
                  </div>
                ))
              : products.map((product) => (
                  <div
                    key={product.id}
                    className="category-product-slide border border-border sm:border-r-0"
                  >
                    <CategoryProductCard product={product} />
                  </div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
