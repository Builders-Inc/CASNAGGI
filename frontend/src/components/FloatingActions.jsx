import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarClock, Mail, MessageCircle, Plus, X } from "lucide-react";

import useApi from "../hooks/useApi";
import { ORG } from "../data/content";

/**
 * Quick-contact cluster, bottom right.
 *
 * z-40 is deliberate. The sticky header is z-50 and every modal/toast overlay
 * in the app is also fixed z-50, so sitting one layer below keeps the cluster
 * above page content but never floating on top of a dialog or its own toast.
 * Matching z-50 would make the outcome depend on DOM order, which is exactly
 * the kind of fragility to avoid.
 */
const FloatingActions = () => {
  // Returns 200 with a null event when nothing is upcoming, so there is no 404
  // in the console on every page load.
  const { data } = useApi("/events/upcoming");
  const upcoming = data?.event ?? null;

  const [expanded, setExpanded] = useState(false); // mobile fan-out
  const [teaserOpen, setTeaserOpen] = useState(false);
  const teaserRef = useRef(null);
  const teaserButtonRef = useRef(null);

  // Escape closes the teaser and returns focus to its trigger. Not a modal, so
  // focus is not trapped.
  useEffect(() => {
    if (!teaserOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setTeaserOpen(false);
        teaserButtonRef.current?.focus();
      }
    };
    const onPointerDown = (event) => {
      if (
        !teaserRef.current?.contains(event.target) &&
        !teaserButtonRef.current?.contains(event.target)
      ) {
        setTeaserOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [teaserOpen]);

  const buttonClass =
    "flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg transition-transform motion-safe:hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-terracotta focus-visible:ring-offset-2";

  return (
    <nav
      aria-label="Quick contact"
      className="fixed right-4 md:right-8 z-40 flex flex-col-reverse items-end gap-3"
      // Clear of the iOS home indicator; falls back cleanly where env() is
      // unsupported.
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
      data-testid="floating-actions"
    >
      {/* Mobile trigger: keeps the cluster to one 48px square instead of a
          180px column sitting over the page content. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`${buttonClass} md:hidden bg-brand-ink text-white`}
        aria-expanded={expanded}
        aria-controls="floating-actions-group"
        aria-label={expanded ? "Close quick contact menu" : "Open quick contact menu"}
        data-testid="fab-toggle"
      >
        {expanded ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>

      <div
        id="floating-actions-group"
        className={`flex-col-reverse items-end gap-3 ${
          expanded ? "flex" : "hidden"
        } md:flex`}
      >
        {/* Upcoming event teaser — rendered only when there is one. */}
        {upcoming && (
          <div className="relative flex items-center">
            {teaserOpen && (
              <div
                ref={teaserRef}
                className="absolute bottom-0 right-16 md:right-[4.5rem] w-[min(20rem,calc(100vw-6rem))] rounded-2xl border border-brand-rule bg-brand-bg p-5 shadow-xl"
                data-testid="fab-teaser-panel"
              >
                <p className="overline">Coming up</p>
                <p className="font-display text-lg font-medium mt-2 leading-snug">
                  {upcoming.title}
                </p>
                <p className="mt-2 text-sm text-brand-mute">
                  {upcoming.dateLabel} · {upcoming.location}
                </p>
                <Link
                  to={`/events/${upcoming.slug}`}
                  onClick={() => {
                    setTeaserOpen(false);
                    setExpanded(false);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-terracotta font-medium hover:underline"
                >
                  See the details <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
            <button
              ref={teaserButtonRef}
              type="button"
              onClick={() => setTeaserOpen((v) => !v)}
              className={`${buttonClass} relative bg-brand-forest text-white`}
              aria-expanded={teaserOpen}
              aria-controls="fab-teaser-panel"
              aria-label={`Upcoming event: ${upcoming.title}`}
              data-testid="fab-upcoming"
            >
              <CalendarClock className="h-5 w-5" />
              {/* Attention ping, suppressed under prefers-reduced-motion. */}
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-terracotta opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-terracotta" />
              </span>
            </button>
          </div>
        )}

        <a
          href={`mailto:${ORG.primaryEmail.address}`}
          className={`${buttonClass} bg-brand-sand text-brand-ink border border-brand-rule`}
          aria-label="Email CASNAGGI"
          data-testid="fab-email"
        >
          <Mail className="h-5 w-5" />
        </a>

        <a
          href={ORG.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-[#25D366] text-white`}
          aria-label="Chat with CASNAGGI on WhatsApp"
          data-testid="fab-whatsapp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      </div>
    </nav>
  );
};

export default FloatingActions;
