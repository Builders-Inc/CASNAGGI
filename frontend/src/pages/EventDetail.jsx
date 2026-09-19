import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  MapPin,
  SearchX,
  Share2,
  Tag,
} from "lucide-react";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import ErrorState from "../components/ErrorState";
import { EventDetailSkeleton } from "../components/EventSkeletons";
import useApi from "../hooks/useApi";

const EventNotFound = () => (
  <>
    <Seo
      title="Event not found"
      description="This event could not be found."
      path="/events"
      noindex
    />
    <section className="py-32" data-testid="event-not-found">
      <div className="container-x">
        <div className="card-tactile max-w-xl mx-auto text-center">
          <SearchX className="h-8 w-8 text-brand-terracotta mx-auto" />
          <h1 className="font-display text-3xl mt-5 font-medium">
            We couldn't find that event.
          </h1>
          <p className="mt-3 text-brand-ink/70 leading-relaxed">
            It may have been removed, or the link may be incorrect.
          </p>
          <Link to="/events" className="btn-primary mt-7" data-testid="event-404-back">
            Browse all events <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  </>
);

const EventDetail = () => {
  const { slug } = useParams();

  // The API resolves prev/next/related server-side, so this page needs one
  // request rather than also downloading the whole archive to compute them.
  const { data, error, status, loading, refetch } = useApi(`/events/${slug}`);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  // Order matters. The original version did a synchronous lookup and redirected
  // when it came back empty; with a fetch, "empty" is also the state on the very
  // first render, so redirecting on falsy data would bounce every visitor to
  // /events before the response arrived.
  //
  // So: wait for loading to settle, treat a confirmed 404 as not-found, and
  // treat anything else as an error worth showing and retrying. A redirect on a
  // transient 500 would make an outage look like the event was deleted.
  if (loading) return <EventDetailSkeleton />;
  if (status === 404) return <EventNotFound />;
  if (error) {
    return (
      <section className="py-32" data-testid="event-error">
        <div className="container-x">
          <ErrorState
            title="We couldn't load this event."
            message="Our server didn't respond. Nothing has been lost — this is a connection problem."
            onRetry={refetch}
            testId="event-error-state"
          />
        </div>
      </section>
    );
  }
  if (!data?.event) return <EventNotFound />;

  const { event, prev, next, related = [] } = data;
  const tags = event.tags || [];

  return (
    <>
      <Seo
        title={event.title}
        description={event.excerpt}
        path={`/events/${event.slug}`}
        image={event.image}
        type="article"
      />
      {/* ---------- HERO ---------- */}
      <section
        className="relative min-h-[75vh] flex items-end overflow-hidden bg-brand-ink"
        data-testid="event-hero"
      >
        <img
          src={event.image}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/60 to-brand-ink/10" />

        <div className="container-x relative z-10 pt-32 pb-20 text-white w-full">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/70 hover:text-white transition"
            data-testid="event-back"
          >
            <ArrowLeft className="h-4 w-4" />
            All Events
          </Link>

          <p className="overline text-brand-clay mt-10">{event.category}</p>
          <h1 className="display-xl mt-4 text-4xl md:text-6xl lg:text-7xl max-w-5xl">
            {event.title}
          </h1>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-terracotta" />
              {event.dateLabel}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-terracotta" />
              {event.location}
            </span>
            {tags.length > 0 && (
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-terracotta" />
                {tags.join(" · ")}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ---------- BODY ---------- */}
      <section className="py-20 md:py-28" data-testid="event-body">
        <div className="container-x grid md:grid-cols-12 gap-12">
          {/* Sidebar with stats */}
          <aside className="md:col-span-4 md:sticky md:top-28 md:self-start space-y-4">
            {(event.stats || []).map((s, i) => (
              <Reveal
                key={i}
                delay={i * 0.08}
                className="card-tactile"
                data-testid={`event-stat-${i}`}
              >
                <div className="font-display text-4xl md:text-5xl font-semibold text-brand-terracotta">
                  {s.value}
                </div>
                <div className="mt-3 text-sm text-brand-ink/70 leading-snug">
                  {s.label}
                </div>
              </Reveal>
            ))}

            <div className="pt-6">
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator
                      .share({
                        title: event.title,
                        text: event.excerpt,
                        url: window.location.href,
                      })
                      .catch(() => {});
                  } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="btn-outline w-full"
                data-testid="event-share"
              >
                <Share2 className="h-4 w-4" /> Share this story
              </button>
            </div>
          </aside>

          {/* Story */}
          <div className="md:col-span-8">
            <Reveal>
              <p className="text-xl md:text-2xl font-display font-medium leading-snug text-brand-ink">
                {event.excerpt}
              </p>
            </Reveal>

            <div className="mt-10 space-y-6">
              {(event.story || []).map((p, i) => (
                <Reveal
                  key={i}
                  delay={i * 0.05}
                  as="p"
                  className="text-lg text-brand-ink/80 leading-relaxed"
                  data-testid={`event-paragraph-${i}`}
                >
                  {p}
                </Reveal>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-4 py-1.5 rounded-full bg-brand-sand text-sm text-brand-ink/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- PREV / NEXT STRIP ---------- */}
      {(prev || next) && (
        <section className="border-t border-brand-rule" data-testid="event-nav">
          <div className="container-x grid md:grid-cols-2">
            {prev && (
              <Link
                to={`/events/${prev.slug}`}
                className="group py-12 md:py-16 md:pr-12 md:border-r border-brand-rule flex items-start gap-6 hover:bg-brand-sand/60 transition-colors duration-300 -mx-6 md:-mx-0 px-6 md:px-0"
                data-testid="event-prev"
              >
                <ArrowLeft className="h-6 w-6 text-brand-terracotta mt-1 transition-transform duration-300 group-hover:-translate-x-1" />
                <div>
                  <div className="overline">Previous event</div>
                  <div className="font-display text-2xl md:text-3xl mt-2 font-medium leading-snug">
                    {prev.title}
                  </div>
                  <div className="mt-2 text-sm text-brand-mute">
                    {prev.dateLabel}
                  </div>
                </div>
              </Link>
            )}

            {next && (
              <Link
                to={`/events/${next.slug}`}
                className="group py-12 md:py-16 md:pl-12 flex items-start justify-end gap-6 text-right hover:bg-brand-sand/60 transition-colors duration-300 -mx-6 md:-mx-0 px-6 md:px-0"
                data-testid="event-next"
              >
                <div>
                  <div className="overline">Next event</div>
                  <div className="font-display text-2xl md:text-3xl mt-2 font-medium leading-snug">
                    {next.title}
                  </div>
                  <div className="mt-2 text-sm text-brand-mute">
                    {next.dateLabel}
                  </div>
                </div>
                <ArrowUpRight className="h-6 w-6 text-brand-terracotta mt-1 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ---------- RELATED ---------- */}
      {related.length > 0 && (
        <section
          className="py-24 md:py-32 bg-brand-sand/60 border-y border-brand-rule"
          data-testid="event-related"
        >
          <div className="container-x">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <p className="overline">More field reports</p>
                <h2 className="display-xl mt-4 text-3xl md:text-4xl">
                  Related events.
                </h2>
              </div>
              <Link to="/events" className="btn-ghost" data-testid="event-all-events">
                See all events <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {related.map((e, i) => (
                <Reveal key={e.slug} delay={i * 0.06}>
                  <Link
                    to={`/events/${e.slug}`}
                    className="block card-tactile h-full group"
                    data-testid={`related-${e.slug}`}
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
                    <h3 className="font-display text-xl mt-3 font-medium leading-snug">
                      {e.title}
                    </h3>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default EventDetail;
