import { describe, expect, it } from "vitest";
import { usePagination } from "../hooks/usePagination";
import { useDebounce } from "../hooks/useDebounce";
import { useSearch } from "../hooks/useSearch";

describe("usePagination", () => {
  it("should calculate pagination correctly", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    
    const { currentPage, pageSize, totalPages, totalCount, paginatedData, setCurrentPage } = usePagination({ data: items, defaultPageSize: 10 });
    
    expect(totalCount).toBe(25);
    expect(totalPages).toBe(3);
    expect(paginatedData.length).toBe(10);
    expect(paginatedData).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("should handle edge cases", () => {
    const emptyItems: number[] = [];
    
    const { totalPages, paginatedData } = usePagination({ data: emptyItems });
    
    expect(totalPages).toBe(0);
    expect(paginatedData).toEqual([]);
  });
});

describe("useDebounce", () => {
  it("should debounce value changes", async () => {
    let debouncedValue = "";
    
    const originalSetTimeout = setTimeout;
    let setTimeoutCalls: Array<{ fn: () => void; delay: number }> = [];
    
    (globalThis as any).setTimeout = (fn: () => void, delay: number) => {
      setTimeoutCalls.push({ fn, delay });
      return 0;
    };
    
    try {
      const { debounce } = useDebounce(() => {}, 300);
      
      debounce("test1");
      debounce("test2");
      debounce("test3");
      
      expect(setTimeoutCalls.length).toBe(3);
      expect(setTimeoutCalls[0].delay).toBe(300);
    } finally {
      (globalThis as any).setTimeout = originalSetTimeout;
    }
  });
});

describe("useSearch", () => {
  it("should filter items based on search term", () => {
    const items = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Cherry" },
      { id: 4, name: "Date" },
    ];
    
    const { search, filteredItems, setSearch } = useSearch(items, (item) => item.name);
    
    expect(search).toBe("");
    expect(filteredItems).toEqual(items);
    
    setSearch("an");
    
    expect(filteredItems.length).toBe(2);
    expect(filteredItems).toEqual([{ id: 1, name: "Apple" }, { id: 2, name: "Banana" }]);
  });

  it("should be case insensitive", () => {
    const items = [{ id: 1, name: "Hello World" }];
    
    const { filteredItems, setSearch } = useSearch(items, (item) => item.name);
    
    setSearch("hello");
    
    expect(filteredItems.length).toBe(1);
  });
});