import React from "react";
import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

/**
 * Without this, an unmatched /admin/* path would fall through to the public
 * catch-all and render the marketing homepage inside the admin area.
 */
const AdminNotFound = () => (
  <div className="max-w-md" data-testid="admin-not-found">
    <SearchX className="h-8 w-8 text-brand-terracotta" />
    <h1 className="font-display text-3xl font-semibold mt-5">Page not found</h1>
    <p className="mt-3 text-brand-ink/70">
      That admin page doesn't exist.
    </p>
    <Link to="/admin/events" className="btn-primary mt-7">
      Back to events
    </Link>
  </div>
);

export default AdminNotFound;
