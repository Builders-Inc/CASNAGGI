import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Copy, Mail, Phone, Landmark } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { ORG } from "../data/content";

const AMOUNTS = [
  { amount: "$25", outcome: "Hygiene kit for one family" },
  { amount: "$75", outcome: "Skills bootcamp scholarship" },
  { amount: "$200", outcome: "Mobile clinic visit to a village" },
  { amount: "$500", outcome: "Micro-grant for a woman-led business" },
];

const Donate = () => {
  return (
    <>
      <Seo
        title="Donate"
        description="Support CASNAGGI's humanitarian and governance work in Nigeria. Every gift powers food relief, mobile clinics, skills training, and civic accountability programs."
        path="/donate"
      />
      <PageHeader
        eyebrow="Give with intent"
        title="Every gift becomes a community."
        lede="CASNAGGI is funded entirely by people who believe Nigerian communities deserve both compassion and accountability. Your donation powers real, measurable programs."
        breadcrumbs={[{ label: "Donate" }]}
      />

      {/* Amount suggestions */}
      <section className="py-20" data-testid="donate-amounts">
        <div className="container-x">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {AMOUNTS.map((a, i) => (
              <Reveal
                key={a.amount}
                delay={i * 0.06}
                className="card-tactile text-center"
                data-testid={`donate-amount-${i}`}
              >
                <div className="font-display text-4xl md:text-5xl font-semibold text-brand-terracotta">
                  {a.amount}
                </div>
                <div className="mt-4 text-sm text-brand-ink/70 leading-snug">
                  {a.outcome}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Ways to give */}
      <section
        className="py-24 md:py-32 bg-brand-sand/60 border-y border-brand-rule"
        data-testid="donate-ways"
      >
        <div className="container-x grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5 md:sticky md:top-28 md:self-start">
            <p className="overline">Ways to give</p>
            <h2 className="display-xl mt-4 text-4xl md:text-5xl">
              Choose the path that suits you.
            </h2>
            <p className="mt-6 text-brand-ink/70 leading-relaxed">
              All donations go directly to CASNAGGI's programs in Nigeria. For
              institutional partnerships or recurring giving, please contact us
              directly.
            </p>
          </div>

          <div className="md:col-span-7 space-y-6">
            <div className="card-tactile" data-testid="give-bank">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-brand-forest/10 text-brand-forest flex items-center justify-center">
                  <Landmark className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-medium">
                  Bank Transfer
                </h3>
              </div>
              <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <dt className="text-brand-mute uppercase tracking-[0.2em] text-xs">
                    Account name
                  </dt>
                  <dd className="font-display text-lg mt-1">
                    Care Support for the Needy Initiative
                  </dd>
                </div>
                <div>
                  <dt className="text-brand-mute uppercase tracking-[0.2em] text-xs">
                    Bank
                  </dt>
                  <dd className="font-display text-lg mt-1">
                    Available on request
                  </dd>
                </div>
                <div>
                  <dt className="text-brand-mute uppercase tracking-[0.2em] text-xs">
                    Swift / Country
                  </dt>
                  <dd className="font-display text-lg mt-1">Nigeria</dd>
                </div>
                <div>
                  <dt className="text-brand-mute uppercase tracking-[0.2em] text-xs">
                    Reference
                  </dt>
                  <dd className="font-display text-lg mt-1">
                    "CASNAGGI – Donation"
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-sm text-brand-mute">
                Please email us for full wire instructions; we share them
                securely on request.
              </p>
            </div>

            <div className="card-tactile" data-testid="give-contact">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-medium">
                  Talk to our team
                </h3>
              </div>
              <p className="mt-4 text-brand-ink/70 leading-relaxed">
                For corporate giving, major gifts, or in-kind donations, reach
                out directly—we'll design a giving plan with you.
              </p>
              <div className="mt-6 space-y-3">
                <a
                  href={`mailto:${ORG.primaryEmail.address}`}
                  className="flex items-center gap-3 text-brand-ink hover:text-brand-terracotta transition"
                  data-testid="donate-email"
                >
                  <Mail className="h-4 w-4" />
                  {ORG.primaryEmail.address}
                </a>
                <a
                  href={`tel:${ORG.primaryPhone.tel}`}
                  className="flex items-center gap-3 text-brand-ink hover:text-brand-terracotta transition"
                  data-testid="donate-phone"
                >
                  <Phone className="h-4 w-4" />
                  {ORG.primaryPhone.display}
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/contact" className="btn-primary" data-testid="donate-contact-btn">
                  Contact us <ArrowUpRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(ORG.primaryEmail.address)}
                  className="btn-outline"
                  data-testid="donate-copy-email"
                >
                  <Copy className="h-4 w-4" /> Copy email
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency pledge */}
      <section className="py-24 md:py-32" data-testid="transparency">
        <div className="container-x grid md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-5">
            <p className="overline">Our pledge</p>
            <h2 className="display-xl mt-4 text-3xl md:text-4xl">
              Transparent to the last Naira.
            </h2>
          </div>
          <div className="md:col-span-7 space-y-6 text-brand-ink/75 text-lg leading-relaxed">
            <p>
              We treat donor trust as our most valuable currency. Every donation
              is tracked, every program is audited, and every annual report is
              made available on request.
            </p>
            <p>
              As a registered Nigerian NGO, CASNAGGI operates under strict
              governance standards—publishing program budgets, outcomes, and
              learnings in plain language.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Donate;
