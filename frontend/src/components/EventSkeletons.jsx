import React from "react";

// Plain divs rather than the shadcn Skeleton so these inherit the marketing
// palette directly and need no extra imports on the public pages.
const Bar = ({ className = "" }) => (
  <div className={`animate-pulse rounded-full bg-brand-clay/40 ${className}`} />
);

const Block = ({ className = "" }) => (
  <div className={`animate-pulse rounded-2xl bg-brand-clay/30 ${className}`} />
);

export const FeaturedSkeleton = () => (
  <div className="grid md:grid-cols-12 gap-8 items-center" data-testid="events-featured-skeleton">
    <div className="md:col-span-7">
      <Block className="aspect-[4/3] w-full" />
    </div>
    <div className="md:col-span-5">
      <Bar className="h-3 w-28" />
      <Bar className="h-9 w-full mt-5" />
      <Bar className="h-9 w-4/5 mt-3" />
      <div className="mt-7 flex gap-5">
        <Bar className="h-3 w-28" />
        <Bar className="h-3 w-36" />
      </div>
      <Bar className="h-4 w-full mt-6" />
      <Bar className="h-4 w-11/12 mt-2" />
    </div>
  </div>
);

export const EventCardSkeleton = () => (
  <div className="card-tactile h-full">
    <Block className="aspect-[4/3] w-full -mx-2 -mt-2 mb-6" />
    <Bar className="h-3 w-24" />
    <Bar className="h-6 w-full mt-4" />
    <Bar className="h-6 w-3/4 mt-2" />
    <Bar className="h-3 w-full mt-5" />
    <Bar className="h-3 w-5/6 mt-2" />
  </div>
);

export const EventGridSkeleton = ({ count = 6 }) => (
  <div
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
    data-testid="events-grid-skeleton"
  >
    {Array.from({ length: count }, (_, i) => (
      <EventCardSkeleton key={i} />
    ))}
  </div>
);

export const EventDetailSkeleton = () => (
  <div data-testid="event-detail-skeleton">
    <section className="relative min-h-[75vh] flex items-end overflow-hidden bg-brand-ink">
      <div className="container-x relative z-10 pt-32 pb-20 w-full">
        <Bar className="h-3 w-24 bg-white/20" />
        <Bar className="h-12 w-4/5 mt-10 bg-white/20" />
        <Bar className="h-12 w-3/5 mt-3 bg-white/20" />
        <div className="mt-10 flex flex-wrap gap-8">
          <Bar className="h-3 w-32 bg-white/20" />
          <Bar className="h-3 w-40 bg-white/20" />
        </div>
      </div>
    </section>
    <section className="py-20 md:py-28">
      <div className="container-x grid md:grid-cols-12 gap-12">
        <div className="md:col-span-4 space-y-4">
          {[0, 1, 2].map((i) => (
            <Block key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="md:col-span-8">
          <Bar className="h-7 w-full" />
          <Bar className="h-7 w-4/5 mt-3" />
          <div className="mt-10 space-y-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Bar key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </section>
  </div>
);
