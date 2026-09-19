import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { CalendarDays, Inbox, LogOut, Menu, X } from "lucide-react";

import Seo from "../components/Seo";
import { useAuth } from "./AuthContext";

const NAV = [
  { to: "/admin/events", label: "Events", icon: CalendarDays },
  { to: "/admin/inbox", label: "Inbox", icon: Inbox },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
    isActive
      ? "bg-brand-terracotta text-white"
      : "text-brand-ink/80 hover:bg-brand-sand"
  }`;

const AdminLayout = () => {
  const { username, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (
    <nav className="space-y-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={linkClass}
          onClick={() => setMenuOpen(false)}
          data-testid={`admin-nav-${label.toLowerCase()}`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-brand-sand/30">
      {/* The admin area must never be indexed. */}
      <Seo title="Admin" description="CASNAGGI site administration." path="/admin" noindex />

      {/* Mobile bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-brand-rule bg-brand-bg px-5 py-4">
        <span className="font-display font-semibold">CASNAGGI Admin</span>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="p-2 rounded-full border border-brand-rule"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {menuOpen && (
        <div className="lg:hidden border-b border-brand-rule bg-brand-bg px-5 py-4">
          {nav}
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r border-brand-rule bg-brand-bg min-h-screen sticky top-0 px-5 py-8">
          <Link to="/admin/events" className="font-display text-xl font-semibold px-4">
            CASNAGGI
            <span className="block text-[10px] uppercase tracking-[0.22em] text-brand-mute font-sans font-normal mt-1">
              Administration
            </span>
          </Link>

          <div className="mt-10 flex-1">{nav}</div>

          <div className="border-t border-brand-rule pt-5 px-4">
            <p className="text-xs text-brand-mute">Signed in as</p>
            <p className="font-medium text-sm mt-0.5">{username || "admin"}</p>
            <button
              type="button"
              onClick={() => signOut()}
              className="mt-4 flex items-center gap-2 text-sm text-brand-ink/70 hover:text-brand-terracotta transition"
              data-testid="admin-signout"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
            <Link
              to="/"
              className="mt-3 block text-xs text-brand-mute hover:text-brand-ink transition"
            >
              View public site →
            </Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-5 py-8 md:px-10 md:py-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
