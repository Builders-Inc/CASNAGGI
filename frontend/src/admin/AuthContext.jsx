import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import api, { setUnauthorizedHandler } from "../lib/api";
import { clearToken, getToken, isExpired, setToken } from "../lib/authToken";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setTokenState] = useState(() => {
    const stored = getToken();
    return stored && !isExpired(stored) ? stored : null;
  });
  const [username, setUsername] = useState(null);
  // True until we've decided whether the stored token is usable. Without this
  // a signed-in admin gets bounced to the login screen on every hard refresh,
  // because the first render happens before that check completes.
  const [bootstrapping, setBootstrapping] = useState(true);

  const signOut = useCallback(
    (options = {}) => {
      clearToken();
      setTokenState(null);
      setUsername(null);
      if (options.redirect !== false) {
        navigate("/admin/login", { replace: true });
      }
    },
    [navigate]
  );

  // A 401 on an authenticated request means the session ended; handle it with
  // a router navigation rather than window.location so any explanatory toast
  // survives.
  useEffect(() => {
    setUnauthorizedHandler(() => signOut());
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;

    async function confirmSession() {
      const stored = getToken();
      if (!stored || isExpired(stored)) {
        clearToken();
        if (!cancelled) {
          setTokenState(null);
          setBootstrapping(false);
        }
        return;
      }
      try {
        const { data } = await api.get("/admin/me");
        if (!cancelled) setUsername(data.username);
      } catch {
        // The interceptor already cleared the token on a 401.
        if (!cancelled) setTokenState(null);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    }

    confirmSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (user, password) => {
    const { data } = await api.post("/admin/login", {
      username: user,
      password,
    });
    setToken(data.access_token);
    setTokenState(data.access_token);
    setUsername(data.username);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      token,
      username,
      bootstrapping,
      isAuthenticated: Boolean(token),
      signIn,
      signOut,
    }),
    [token, username, bootstrapping, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
