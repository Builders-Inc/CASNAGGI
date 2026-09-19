import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, LogIn } from "lucide-react";

import Seo from "../../components/Seo";
import { useAuth } from "../AuthContext";

const Login = () => {
  const { signIn, isAuthenticated, bootstrapping } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || "/admin/events";

  if (!bootstrapping && isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(username, password);
      navigate(destination, { replace: true });
    } catch (err) {
      // A 401 here is a wrong password, not an expired session -- the
      // interceptor deliberately leaves unauthenticated 401s alone so this
      // message is the one the user sees.
      setError(
        err.status === 401
          ? "Incorrect username or password."
          : err.status === 429
          ? "Too many attempts. Please wait a few minutes and try again."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-sand/40 px-5 py-12">
      <Seo title="Admin sign in" description="CASNAGGI administration." path="/admin/login" noindex />

      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-brand-bg border border-brand-rule rounded-2xl p-8 md:p-10"
        data-testid="admin-login-form"
      >
        <p className="overline">CASNAGGI</p>
        <h1 className="font-display text-3xl font-semibold mt-3">Admin sign in</h1>
        <p className="mt-3 text-sm text-brand-ink/70">
          Manage events and read messages sent through the website.
        </p>

        <div className="mt-8">
          <label className="overline text-brand-mute" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-2 w-full px-5 py-3.5 rounded-xl border border-brand-rule bg-white focus:outline-none focus:border-brand-terracotta transition"
            data-testid="admin-username"
          />
        </div>

        <div className="mt-4">
          <label className="overline text-brand-mute" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full px-5 py-3.5 rounded-xl border border-brand-rule bg-white focus:outline-none focus:border-brand-terracotta transition"
            data-testid="admin-password"
          />
        </div>

        {error && (
          <div
            className="mt-6 flex items-start gap-3 rounded-xl border border-brand-terracotta/40 bg-brand-terracotta/5 px-4 py-3 text-sm"
            role="alert"
            data-testid="admin-login-error"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 text-brand-terracotta flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full mt-7 justify-center disabled:opacity-60"
          data-testid="admin-login-submit"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" /> Sign in
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
