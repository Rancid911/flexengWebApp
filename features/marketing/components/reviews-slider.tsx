"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

import type { CarouselApi } from "@/components/ui/carousel";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

import { Button } from "@/components/ui/button";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/use-media-query";

type ReviewItem = {
  name: string;
  quote: string;
  avatarUrl?: string;
};

const REVIEW_AVATARS_BY_FIRST_NAME: Record<string, string> = {
  мария: "/images/reviews/maria.jpg",
  андрей: "/images/reviews/andrey.jpg",
  екатерина: "/images/reviews/ekaterina.jpg",
  ирина: "/images/reviews/irina.jpg",
  дмитрий: "/images/reviews/dmitriy.jpg",
  ольга: "/images/reviews/olga.jpg",
  никита: "/images/reviews/nikita.jpg",
  светлана: "/images/reviews/svetlana.jpg"
};

const DEFAULT_AVATAR_URLS = Object.values(REVIEW_AVATARS_BY_FIRST_NAME);

function getAvatarUrl(review: ReviewItem, index: number) {
  if (review.avatarUrl) return review.avatarUrl;
  const firstName = review.name.split(",")[0]?.trim().split(" ")[0]?.toLowerCase();
  return (firstName && REVIEW_AVATARS_BY_FIRST_NAME[firstName]) || DEFAULT_AVATAR_URLS[index % DEFAULT_AVATAR_URLS.length];
}

export function ReviewsSlider({ items }: { items: ReviewItem[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px)");
  const prefersReducedMotion = usePrefersReducedMotion();
  const visibleCount = isDesktop ? 3 : isTablet ? 2 : 1;

  const maxStartIndex = Math.max(0, items.length - visibleCount);
  const pageCount = maxStartIndex + 1;
  const isMobile = visibleCount === 1;
  const canAutoplay = Boolean(api) && pageCount > 1 && autoplayEnabled && !prefersReducedMotion && !isHovered && !isFocusedWithin;

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap() % pageCount);
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api, pageCount]);

  useEffect(() => {
    if (!api || !canAutoplay) return;

    const timer = window.setInterval(() => {
      api.scrollNext();
    }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }, [api, canAutoplay]);

  const basisClass = useMemo(() => {
    if (visibleCount === 3) return "basis-1/3";
    if (visibleCount === 2) return "basis-1/2";
    return "basis-full";
  }, [visibleCount]);

  if (items.length === 0) return null;

  return (
    <div
      className={isMobile ? "mx-auto max-w-[20rem]" : ""}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusedWithin(true)}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setIsFocusedWithin(false);
      }}
    >
      <div
        className={`overflow-hidden rounded-3xl border border-[#E3DDF2] bg-[linear-gradient(160deg,#F8F3FF_0%,#FFFFFF_60%)] shadow-[0_14px_40px_rgba(101,78,214,0.12)] ${
          isMobile ? "h-[48vh] min-h-[360px] max-h-[430px] p-0" : "p-2 md:h-[360px] md:px-4 md:py-3 lg:h-[380px]"
        }`}
      >
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
            dragFree: false
          }}
          className="h-full"
        >
          <CarouselContent viewportClassName="h-full" className="h-full items-stretch -ml-0 pl-0 md:-ml-4">
            {items.map((review, index) => (
              <CarouselItem
                key={review.name}
                className={`h-full self-stretch pl-0 md:pl-4 ${basisClass}`}
                style={{
                  minHeight: isMobile ? "100%" : undefined
                }}
              >
                <article className="h-full">
                  <div
                    className={`flex h-full flex-col rounded-2xl border border-[#E8E1F8] bg-white shadow-[0_10px_24px_rgba(70,53,132,0.10)] ${
                      isMobile ? "rounded-none border-0 p-5 shadow-none" : "p-5 md:p-6"
                    }`}
                  >
                    <p className="mb-3 text-4xl leading-none text-[#8D70FF]">“</p>
                    <p className={`leading-relaxed text-[#5D597A] ${isMobile ? "text-[15px]" : "text-sm md:text-base"}`}>{review.quote}</p>
                    <div className="mt-auto flex items-center gap-3 pt-4">
                      <Image
                        src={getAvatarUrl(review, index)}
                        alt={`Аватар: ${review.name}`}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-[#EEE8FF]"
                        loading="lazy"
                      />
                      <p className="text-sm font-semibold text-[#322F55]">{review.name}</p>
                    </div>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Array.from({ length: pageCount }).map((_, index) => (
            <button
              key={`review-page-${index + 1}`}
              type="button"
              onClick={() => {
                setAutoplayEnabled(false);
                api?.scrollTo(index);
              }}
              aria-label={`Показать отзывы ${index + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-[width,background-color,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D70FF] focus-visible:ring-offset-2 ${
                activeIndex === index ? "w-7 bg-[#8D70FF]" : "bg-[#CFC4E8] hover:bg-[#b8acd8]"
              }`}
            />
          ))}
        </div>
        {isMobile ? <p className="text-xs font-medium text-[#6E6A89]">{Math.min(activeIndex + 1, pageCount)} / {pageCount}</p> : null}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-[#D9D0EE] bg-white px-3 text-xs font-bold text-[#654ED6] hover:bg-[#F7F3FF]"
            onClick={() => setAutoplayEnabled((current) => !current)}
            aria-pressed={autoplayEnabled}
          >
            {autoplayEnabled ? "Пауза" : "Автопрокрутка"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl border-[#D9D0EE] bg-[#F7F3FF] text-[#654ED6] hover:bg-[#EEE8FF]"
            onClick={() => {
              setAutoplayEnabled(false);
              api?.scrollPrev();
            }}
            aria-label="Предыдущий отзыв"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl border-[#D9D0EE] bg-[#F7F3FF] text-[#654ED6] hover:bg-[#EEE8FF]"
            onClick={() => {
              setAutoplayEnabled(false);
              api?.scrollNext();
            }}
            aria-label="Следующий отзыв"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
