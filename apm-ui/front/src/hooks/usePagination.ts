import { useState, useMemo, useCallback } from "react";

interface UsePaginationOptions<T> {
  data: T[];
  defaultPageSize?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  startIndex: number;
  endIndex: number;
  paginatedData: T[];
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  reset: () => void;
}

export function usePagination<T>({
  data,
  defaultPageSize = 10,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(data.length / pageSize)), [data.length, pageSize]);
  const totalCount = data.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, data.length);

  const paginatedData = useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

  const setPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const setSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setPageSize(defaultPageSize);
  }, [defaultPageSize]);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalCount,
    startIndex,
    endIndex,
    paginatedData,
    setCurrentPage: setPage,
    setPageSize: setSize,
    nextPage,
    prevPage,
    canNextPage: currentPage < totalPages,
    canPrevPage: currentPage > 1,
    reset,
  };
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  startIndex: number;
  endIndex: number;
}

export function getPaginationInfo<T>(
  data: T[],
  currentPage: number,
  pageSize: number
): PaginationInfo {
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, data.length);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalCount: data.length,
    startIndex,
    endIndex,
  };
}
