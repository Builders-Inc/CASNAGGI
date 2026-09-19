import axios from 'axios';

import { clearToken, getToken, isExpired } from './authToken';

// Baked in at build time by CRA. On Netlify set REACT_APP_API_URL to the VPS
// API domain; locally it falls back to the dev server.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Callback registered by the auth context, so a rejected token can be handled
// with a router navigation instead of window.location, which would full-page
// reload and throw away any toast explaining what happened.
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !isExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    // Only treat a 401 as "your session ended" when the request actually
    // carried a token. A 401 from a public endpoint -- or from the login form
    // itself on a wrong password -- must not trigger a global sign-out, or it
    // would fight with the login screen's own error handling.
    const wasAuthenticated = Boolean(config?.headers?.Authorization);
    if (response?.status === 401 && wasAuthenticated) {
      clearToken();
      if (onUnauthorized) onUnauthorized();
    }

    return Promise.reject(normalizeError(error));
  }
);

/**
 * Flatten axios/FastAPI errors into one predictable shape.
 *
 * FastAPI returns 422 as a `detail` array of per-field errors; surfacing those
 * inline is the difference between "something went wrong" and "email is not
 * valid".
 */
export function normalizeError(error) {
  const status = error.response?.status ?? 0;
  const detail = error.response?.data?.detail;
  const fieldErrors = {};
  let message;

  if (Array.isArray(detail)) {
    detail.forEach((item) => {
      const field = item.loc?.filter((part) => part !== 'body').join('.');
      if (field) fieldErrors[field] = item.msg;
    });
    message = 'Please check the highlighted fields.';
  } else if (typeof detail === 'string') {
    message = detail;
  } else if (status === 0) {
    message = "We couldn't reach the server. Check your connection and try again.";
  } else {
    message = 'Something went wrong. Please try again.';
  }

  const normalized = new Error(message);
  normalized.status = status;
  normalized.fieldErrors = fieldErrors;
  normalized.retryAfter = Number(error.response?.headers?.['retry-after']) || null;
  return normalized;
}

export default api;
