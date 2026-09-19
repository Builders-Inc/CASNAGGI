import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Calendar, MapPin, Sparkles } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import ErrorState from "../components/ErrorState";
import { EventGridSkeleton, FeaturedSkeleton } from "../components/EventSkeletons";
import useApi from "../hooks/useApi";

const Events = () => {
  const [filter, setFilter] = useState("All");

  // Past events only: this page is the archive of field reports. A future-dated
  // event must not take the featured slot, so upcoming ones surface in their own
  // strip above instead.
  const { data, loading, error, refetch } = useApi("/events", {
    params: { status: "past" },
  });
  const { data: upcomingData } = useApi("/events/upcoming");

  const events = useMemo(() => data?.items ?? [], [data]);
  const categories = useMemo(
    () => ["All", ...(data?.categories ?? [])],
    [data]
  );
  const upcoming = upcomingData?.event ?? null;

  const filtered =
    filter === "All" ? events : events.filter((e) => e.category === filter);

  // Position, not a flag: the API returns newest-first, so the first item is
  // the latest report.
  const featured = events[0];
  const showFeatured = filter === "All" && Boolean(featured);
  const gridItems = showFeatured ? filtered.slice(1) : filtered;

  return (
    <>
      <Seo
        title="Events & Outreaches"
        description="Field reports from CASNAGGI's humanitarian outreaches and governance activities — cash gifts, medical outreach, youth forums, public dialogues and more."
        path="/events"
      />
      <PageHeader
        eyebrow="Events & Outreaches"
        title="Field reports from the front line."
        lede="Every outreach, every community dialogue, every training — documented and shared. Browse CASNAGGI's humanitarian events and governance activities."
        breadcrumbs={[{ label: "Events" }]}
      />

      {/* Coming up */}
      {upcoming && (
        <section className="pt-12" data-testid="events-upcoming-strip">
          <div className="container-x">
            <Reveal>
              <Link
                to={`/events/${upcoming.slug}`}
                className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 rounded-2xl border border-brand-terracotta/30 bg-brand-terracotta/5 px-6 py-5 hover:bg-brand-terracotta/10 transition-colors"
                data-testid="events-upcoming-link"
              >
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-terracotta whitespace-nowrap">
                  <Sparkles className="h-4 w-4" /> Coming up
                </span>
                <span className="font-display text-lg md:text-xl font-medium flex-1">
                  {upcoming.title}
                </span>
                <span className="text-sm text-brand-mute whitespace-nowrap">
                  {upcoming.dateLabel} · {upcoming.location}
                </span>
                <ArrowUpRight className="h-5 w-5 text-brand-terracotta flex-shrink-0" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* Filter chips */}
      <section className="py-12" data-testid="events-filters">
        <div className="container-x">
          <div className="flex flex-wrap gap-3">
            {loading && !data
              ? Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="h-11 w-28 rounded-full bg-brand-clay/30 animate-pulse"
                  />
                ))
              : categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    className={`px-5 py-2.5 rounded-full text-sm transition-all ${
                      filter === c
                        ? "bg-brand-ink text-white border border-brand-ink"
                        : "border border-brand-rule hover:bg-brand-sand hover:border-brand-clay"
                    }`}
                    data-testid={`events-filter-${c
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {c}
                  </button>
                ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="pb-24" data-testid="events-error">
          <div className="container-x">
            <ErrorState
              title="We couldn't load the events."
              message="Our server didn't respond. The events are safe — this is a connection problem, and retrying usually fixes it."
              onRetry={refetch}
              testId="events-error-state"
            />
          </div>
        </section>
      ) : (
        <>
          {/* Featured event */}
          {(loading || showFeatured) && (
            <section className="pb-20" data-testid="events-featured">
              <div className="container-x">
                {loading && !data ? (
                  <FeaturedSkeleton />
                ) : (
                  <Reveal>
                    <Link
                      to={`/events/${featured.slug}`}
                      className="grid md:grid-cols-12 gap-8 items-center group"
                      data-testid="events-featured-link"
                    >
                      <div className="md:col-span-7">
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-brand-sand">
                          <img
                            src={featured.image}
                            alt={featured.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-brand-terracotta text-white text-xs uppercase tracking-[0.2em]">
                            Latest · {featured.dateLabel}
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-5">
                        <p className="overline">{featured.category}</p>
                        <h2 className="display-xl mt-4 text-3xl md:text-4xl lg:text-5xl group-hover:text-brand-terracotta transition-colors">
                          {featured.title}
                        </h2>
                        <div className="mt-6 flex flex-wrap gap-5 text-sm text-brand-mute">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-brand-terracotta" />
                            {featured.dateLabel}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-brand-terracotta" />
                            {featured.location}
                          </span>
                        </div>
                        <p className="mt-6 text-lg text-brand-ink/75 leading-relaxed">
                          {featured.excerpt}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {(featured.tags || []).map((t) => (
                            <span
                              key={t}
                              className="px-3 py-1 rounded-full bg-brand-sand text-xs text-brand-ink/70"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <span className="mt-8 inline-flex items-center gap-2 text-brand-terracotta font-medium">
                          Read the field report <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                )}
              </div>
            </section>
          )}

          {/* Events grid */}
          <section
            className="py-16 bg-brand-sand/60 border-y border-brand-rule"
            data-testid="events-grid"
          >
            <div className="container-x">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <div>
                  <p className="overline">Archive</p>
                  <h2 className="display-xl mt-4 text-3xl md:text-4xl">
                    {filter === "All" ? "All events" : filter}
                  </h2>
                </div>
                {!loading && (
                  <span className="text-sm text-brand-mute">
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "event" : "events"} posted
                  </span>
                )}
              </div>

              {loading && !data ? (
                <EventGridSkeleton />
              ) : events.length === 0 ? (
                <p className="text-brand-mute" data-testid="events-empty">
                  No events have been published yet. Check back soon.
                </p>
              ) : gridItems.length === 0 ? (
                <p className="text-brand-mute">No events in this category yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {gridItems.map((e, i) => (
                    <Reveal key={e.slug} delay={i * 0.05}>
                      <Link
                        to={`/events/${e.slug}`}
                        className="card-tactile h-full flex flex-col group"
                        data-testid={`event-${e.slug}`}
                      >
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden -mx-2 -mt-2 mb-6">
                          <img
                            src={e.image}
                            alt={e.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-[10px] uppercase tracking-[0.2em] text-brand-ink">
                            {e.dateLabel}
                          </div>
                        </div>
                        <p className="overline">{e.category}</p>
                        <h3 className="font-display text-xl md:text-2xl mt-3 font-medium leading-snug group-hover:text-brand-terracotta transition-colors">
                          {e.title}
                        </h3>
                        <p className="mt-3 text-brand-ink/70 text-sm leading-relaxed flex-1">
                          {e.excerpt}
                        </p>
                        <div className="mt-5 pt-5 border-t border-brand-rule flex items-center justify-between text-xs text-brand-mute">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            {e.location}
                          </span>
                          <span className="flex items-center gap-1 text-brand-terracotta">
                            Read report <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Submit-an-event CTA */}
      <section className="py-24" data-testid="events-cta">
        <div className="container-x grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-8">
            <p className="overline">Want to host a CASNAGGI outreach?</p>
            <h2 className="display-xl mt-4 text-3xl md:text-4xl lg:text-5xl">
              Partner with us on the next community event.
            </h2>
          </div>
          <div className="md:col-span-4 flex gap-3 md:justify-end">
            <Link to="/contact" className="btn-primary" data-testid="events-contact-btn">
              Propose a partnership <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Events;
