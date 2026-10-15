import React, { useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Reveal from "./Reveal";

/**
 * Photo grid with a full-screen viewer.
 *
 * Built on the Radix dialog primitive rather than the styled DialogContent,
 * which is a small centred card; this needs the whole viewport. Radix still
 * provides the focus trap, Escape to close and scroll locking.
 */
const EventGallery = ({ images }) => {
  const [open, setOpen] = useState(null);
  const count = images.length;

  const step = useCallback(
    (delta) => setOpen((i) => (i === null ? i : (i + delta + count) % count)),
    [count]
  );

  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  const current = open === null ? null : images[open];

  return (
    <>
      <div
        className="columns-2 md:columns-3 lg:columns-4 gap-4 [&>*]:mb-4"
        data-testid="event-gallery"
      >
        {images.map((img, i) => (
          <Reveal key={img.src} delay={(i % 4) * 0.05} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block w-full overflow-hidden rounded-xl bg-brand-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-terracotta"
              aria-label={`View photo ${i + 1} of ${count}${img.alt ? `: ${img.alt}` : ""}`}
              data-testid={`event-gallery-${i}`}
            >
              <img
                src={img.src}
                alt={img.alt || ""}
                loading="lazy"
                className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/90 text-brand-ink flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition">
                <Expand className="h-4 w-4" />
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <DialogPrimitive.Root
        open={open !== null}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 flex flex-col focus:outline-none"
            aria-describedby={undefined}
            data-testid="event-lightbox"
          >
            <div className="flex items-center justify-between px-4 md:px-8 py-4 text-white/80 text-sm">
              <DialogPrimitive.Title className="font-normal">
                {open !== null && `${open + 1} / ${count}`}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>

            <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 md:px-20">
              {current && (
                <img
                  src={current.src}
                  alt={current.alt || ""}
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              )}
              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    className="absolute left-2 md:left-6 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    className="absolute right-2 md:right-6 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            <p className="px-4 md:px-8 py-5 text-center text-sm text-white/75 min-h-[3.5rem]">
              {current?.alt}
            </p>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
};

export default EventGallery;
