import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Phone, Mail } from "lucide-react";
import { LOGO_URL, NAV, ORG } from "../data/content";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <>
      {/* top utility strip */}
      <div
        className="hidden lg:block bg-brand-forest text-white/80 text-xs"
        data-testid="top-utility-strip"
      >
        <div className="container-x flex items-center justify-between py-2.5">
          <div className="flex items-center gap-6">
            <a
              href={`tel:${ORG.primaryPhone.tel}`}
              className="flex items-center gap-2 hover:text-white transition"
              data-testid="utility-phone"
            >
              <Phone className="h-3.5 w-3.5" />
              {ORG.primaryPhone.display}
            </a>
            <a
              href={`mailto:${ORG.primaryEmail.address}`}
              className="flex items-center gap-2 hover:text-white transition"
              data-testid="utility-email"
            >
              <Mail className="h-3.5 w-3.5" />
              {ORG.primaryEmail.address}
            </a>
          </div>
          <div className="tracking-[0.22em] uppercase text-[10px] text-white/60">
            Registered NGO · Nigeria
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 border-b ${
          scrolled
            ? "bg-brand-bg/90 border-brand-rule"
            : "bg-brand-bg/70 border-transparent"
        }`}
        data-testid="site-header"
      >
        <div className="container-x flex items-center justify-between py-4">
          <Link
            to="/"
            className="flex items-center gap-3 group"
            data-testid="nav-logo"
          >
            <img
              src={LOGO_URL}
              alt="CASNAGGI"
              className="h-11 w-11 rounded-full object-cover ring-1 ring-brand-rule"
            />
            <div className="leading-tight">
              <div className="font-display text-lg font-semibold tracking-tight">
                CASNAGGI
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-brand-mute">
                Care · Governance · Nigeria
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.testid}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    isActive
                      ? "text-brand-terracotta"
                      : "text-brand-ink/80 hover:text-brand-ink"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/donate"
              className="btn-primary hidden md:inline-flex"
              data-testid="header-donate-btn"
            >
              Donate
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden p-2 rounded-full border border-brand-rule"
              aria-label="Toggle menu"
              data-testid="mobile-menu-toggle"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* mobile panel */}
        {open && (
          <div
            className="lg:hidden border-t border-brand-rule bg-brand-bg"
            data-testid="mobile-menu"
          >
            <div className="container-x py-6 flex flex-col gap-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className="py-3 text-lg font-display font-medium border-b border-brand-rule"
                  data-testid={`${n.testid}-mobile`}
                >
                  {n.label}
                </NavLink>
              ))}
              <Link
                to="/donate"
                className="btn-primary mt-4 self-start"
                data-testid="mobile-donate-btn"
              >
                Donate
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
