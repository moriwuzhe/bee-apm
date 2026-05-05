import { useState, useEffect, useCallback, useRef } from "react";

interface ApiQueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isFetching: boolean;
}

interface UseApiQueryOptions<T> {
  enabled?: boolean;
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refetchInterval?: number;
  retry?: number;
}

interface UseApiQueryReturn<T> extends ApiQueryState<T> {
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryReturn<T> {
  const [state, setState] = useState<ApiQueryState<T>>({
    data: options.initialData ?? null,
    loading: true,
    error: null,
    isFetching: false,
  });
  const { enabled = true, onSuccess, onError, refetchInterval, retry = 3 } = options;
  const retryCountRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const fetchData = useCallback(async (isRefetch = false) => {
    if (!enabled) return;
    try {
      setState(prev => ({ ...prev, isFetching: true, error: null }));
      const data = await fetcher();
      setState(prev => ({
        data,
        loading: false,
        error: null,
        isFetching: false,
      }));
      retryCountRef.current = 0;
      onSuccess?.(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (retryCountRef.current < retry) {
        retryCountRef.current += 1;
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        await fetchData(isRefetch);
        return;
      }
      setState(prev => ({
        ...prev,
        error: err,
        loading: false,
        isFetching: false,
      }));
      onError?.(err);
    }
  }, [fetcher, enabled, onSuccess, onError, retry]);
  const setData = useCallback((newData: T | null) => {
    setState(prev => ({ ...prev, data: newData }));
  }, []);
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    if (refetchInterval) {
      intervalRef.current = window.setInterval(() => {
        fetchData(true);
      }, refetchInterval);
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchInterval, fetchData]);
  return { ...state, refetch, setData };
}
