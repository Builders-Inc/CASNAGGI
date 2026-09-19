import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Compass } from "lucide-react";

import Seo from "../components/Seo";
import { NAV } from "../data/content";

/**
 * Replaces the previous catch-all, which rendered the homepage for every
 * unmatched URL -- a soft 200 that told search engines a typo'd path was real
 * content, and left visitors with no idea they'd gone somewhere wrong.
 */
const NotFound = () => (
  <>
    <Seo
      title="Page not found"
      description="That page doesn't exist. Browse CASNAGGI's programmes, events and impact instead."
      path="/404"
      noindex
    />
    <section className="py-32 md:py-44" data-testid="not-found">
      <div className="container-x max-w-2xl text-center">
        <Compass className="h-10 w-10 text-brand-terracotta mx-auto" />
        <p className="overline mt-8">Page not found</p>
        <h1 className="display-xl mt-4 text-4xl md:text-6xl">
          This page has moved on.
        </h1>
        <p className="mt-6 text-lg text-brand-ink/70 leading-relaxed">
          The link may be out of date, or the address slightly off. Here's where
          you might be headed:
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-5 py-2.5 rounded-full border border-brand-rule text-sm hover:bg-brand-sand hover:border-brand-clay transition"
            >
              {n.label}
            </Link>
          ))}
        </div>

        <Link to="/" className="btn-primary mt-10">
          Back to the homepage <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  </>
);

export default NotFound;
