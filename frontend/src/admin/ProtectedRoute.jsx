import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "./AuthContext";

/**
 * Gate for the signed-in admin area.
 *
 * Nothing here is a security boundary -- the whole admin bundle is public and
 * every check is re-enforced server-side. This only decides what to render.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, bootstrapping } = useAuth();
  const location = useLocation();

  // Wait for the stored-token check before deciding, or a hard refresh would
  // redirect a perfectly valid session to the login page.
  if (bootstrapping) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-brand-sand/40"
        data-testid="admin-bootstrapping"
      >
        <Loader2 className="h-6 w-6 animate-spin text-brand-terracotta" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
