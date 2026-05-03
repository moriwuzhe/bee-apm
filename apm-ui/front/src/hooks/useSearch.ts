import { useState, useCallback, useMemo } from "react";

interface UseSearchOptions<T> {
  data: T[];
  searchKeys: (keyof T)[];
  debounceMs?: number;
}

interface UseSearchReturn<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredData: T[];
  handleSearch: () => void;
  clearSearch: () => void;
  isSearching: boolean;
}

export function useSearch<T>({
  data,
  searchKeys,
  debounceMs = 300,
}: UseSearchOptions<T>): UseSearchReturn<T> {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredData = useMemo(() => {
    if (!debouncedTerm) return data;

    const lowerTerm = debouncedTerm.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        if (typeof value === "string") {
          return value.toLowerCase().includes(lowerTerm);
        }
        if (typeof value === "number") {
          return value.toString().includes(lowerTerm);
        }
        return false;
      })
    );
  }, [data, debouncedTerm, searchKeys]);

  const handleSearch = useCallback(() => {
    setIsSearching(true);
    setDebouncedTerm(searchTerm);
    setTimeout(() => setIsSearching(false), debounceMs);
  }, [searchTerm, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedTerm("");
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    handleSearch,
    clearSearch,
    isSearching,
  };
}

interface FilterOption {
  value: string;
  label: string;
}

interface UseFilterReturn<T> {
  filterValue: string;
  setFilterValue: (value: string) => void;
  filteredData: T[];
  options: FilterOption[];
}

export function useFilter<T>(
  data: T[],
  filterKey: keyof T,
  options: FilterOption[],
  defaultValue = "all"
): UseFilterReturn<T> {
  const [filterValue, setFilterValue] = useState(defaultValue);

  const filteredData = useMemo(() => {
    if (filterValue === defaultValue) return data;
    return data.filter((item) => item[filterKey] === filterValue);
  }, [data, filterKey, filterValue, defaultValue]);

  return {
    filterValue,
    setFilterValue,
    filteredData,
    options,
  };
}
