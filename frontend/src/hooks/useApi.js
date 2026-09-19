import { useCallback, useEffect, useRef, useState } from "react";

import api from "../lib/api";

/**
 * Minimal GET hook: { data, error, status, loading, refetch }.
 *
 * Deliberately not react-query. This app has four read surfaces, no shared
 * cache, no optimistic updates and no polling, so the library would cost more
 * in bundle size and setup than the ~40 lines it replaces. If optimistic admin
 * edits or refetch-on-focus are ever wanted, swapping this out is mechanical.
 *
 * `loading` starts true and returns to true whenever the path changes, which is
 * what stops a consumer briefly seeing stale data -- or, on the event detail
 * page, redirecting away before the first response has even arrived.
 */
export default function useApi(path, { params, skip = false } = {}) {
  const [state, setState] = useState({
    data: null,
    error: null,
    status: 0,
    loading: !skip,
  });

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Serialised so a caller can pass an object literal without re-firing the
  // effect on every render.
  const paramsKey = JSON.stringify(params ?? null);

  const run = useCallback(
    async (signal) => {
      if (skip || !path) return;
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await api.get(path, {
          params: params ?? undefined,
          signal,
        });
        if (!mounted.current || signal?.aborted) return;
        setState({
          data: response.data,
          error: null,
          status: response.status,
          loading: false,
        });
      } catch (error) {
        // An aborted request is a superseded one, not a failure to report.
        if (error.name === "CanceledError" || signal?.aborted) return;
        if (!mounted.current) return;
        setState({
          data: null,
          error,
          status: error.status ?? 0,
          loading: false,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path, paramsKey, skip]
  );

  useEffect(() => {
    // Cancelling on cleanup is what prevents a slow earlier response landing
    // after a faster later one when filters or slugs change quickly.
    const controller = new AbortController();
    run(controller.signal);
    return () => controller.abort();
  }, [run]);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    return run(controller.signal);
  }, [run]);

  return { ...state, refetch };
}
