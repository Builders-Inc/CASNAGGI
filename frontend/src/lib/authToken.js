// Admin token storage, kept in its own module so the axios interceptor and the
// auth context can both reach it without importing each other.
//
// localStorage throws in some privacy modes, so every access is guarded and
// falls back to "signed out" rather than crashing the app.

const KEY = "casnaggi_admin_token";

export function getToken() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(KEY, token);
    } else {
      window.localStorage.removeItem(KEY);
    }
  } catch {
    /* storage unavailable: the session simply won't survive a reload */
  }
}

export function clearToken() {
  setToken(null);
}

/**
 * Read the `exp` claim without pulling in a JWT library.
 *
 * Only used to avoid sending a token we already know is stale; the server is
 * still the authority on whether a token is valid.
 */
export function isExpired(token) {
  if (!token) return true;
  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp !== "number" || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
