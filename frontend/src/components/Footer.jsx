import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";
import { ORG, NAV, LOGO_URL } from "../data/content";

const Footer = () => {
  return (
    <footer
      className="relative bg-brand-ink text-white mt-24 overflow-hidden"
      data-testid="site-footer"
    >
      <div className="container-x pt-20 pb-10">
        {/* Massive CTA */}
        <div className="border-b border-white/10 pb-16">
          <p className="overline text-brand-terracotta">Let's build it together</p>
          <h2 className="font-display font-medium tracking-tight leading-[0.95] mt-6 text-[14vw] md:text-[10vw] lg:text-[8.5vw]">
            Hope, <span className="italic font-light text-brand-clay">in action.</span>
          </h2>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/donate"
              className="btn-primary"
              data-testid="footer-donate-btn"
            >
              Donate Now <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/get-involved"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/25 text-white font-medium hover:bg-white hover:text-brand-ink transition-all duration-300"
              data-testid="footer-volunteer-btn"
            >
              Volunteer with us <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-16">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <img
                src={LOGO_URL}
                alt="CASNAGGI"
                className="h-12 w-12 rounded-full ring-1 ring-white/20"
              />
              <div>
                <div className="font-display text-lg font-semibold">CASNAGGI</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/50">
                  Care Support · Good Governance
                </div>
              </div>
            </div>
            <p className="mt-6 text-white/70 max-w-sm leading-relaxed">
              {ORG.name}. A registered Nigerian NGO blending humanitarian relief
              with civic accountability.
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="overline text-white/50">Explore</div>
            <ul className="mt-6 space-y-3">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    className="hover:text-brand-terracotta transition-colors"
                    data-testid={`footer-${n.testid}`}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/donate"
                  className="hover:text-brand-terracotta transition-colors"
                  data-testid="footer-donate-link"
                >
                  Donate
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="overline text-white/50">Reach us</div>
            <ul className="mt-6 space-y-4 text-white/80">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-brand-terracotta" />
                <span>{ORG.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-brand-terracotta" />
                <span>{ORG.branches}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-1 text-brand-terracotta" />
                <span className="flex flex-col gap-1">
                  {ORG.phones.map((p) => (
                    <a
                      key={p.tel}
                      href={`tel:${p.tel}`}
                      className="hover:text-white"
                      data-testid={`footer-phone-${p.label.toLowerCase()}`}
                    >
                      {p.display}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-1 text-brand-terracotta" />
                <span className="flex flex-col gap-1">
                  {ORG.emails.map((e) => (
                    <a
                      key={e.address}
                      href={`mailto:${e.address}`}
                      className="hover:text-white break-all"
                      data-testid={`footer-email-${e.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {e.address}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowUpRight className="h-4 w-4 mt-1 text-brand-terracotta" />
                <a
                  href={`https://${ORG.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white break-all"
                  data-testid="footer-website"
                >
                  {ORG.website}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-brand-terracotta">
                  CAC
                </span>
                <span className="text-white/80 font-mono text-sm">{ORG.rc}</span>
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              {ORG.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="px-4 py-2 text-xs uppercase tracking-[0.2em] rounded-full border border-white/20 hover:border-brand-terracotta hover:text-brand-terracotta transition-colors"
                  data-testid={`footer-social-${s.label.toLowerCase()}`}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-white/50">
          <div>© {new Date().getFullYear()} CASNAGGI. All rights reserved.</div>
          <div className="tracking-[0.22em] uppercase">Nigeria · Est. {ORG.founded}</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
