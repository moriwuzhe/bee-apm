import { Search, X } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  canPrev: boolean;
  canNext: boolean;
  canPrevPage?: boolean;
  canNextPage?: boolean;
}

export function Pagination({
  currentPage,
  pageSize,
  totalPages,
  totalCount,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  canPrev,
  canNext,
  canPrevPage,
  canNextPage,
}: PaginationProps) {
  const canGoPrev = canPrevPage ?? canPrev;
  const canGoNext = canNextPage ?? canNext;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between py-3 px-4 border-t border-border">
      <div className="text-xs text-muted-foreground">
        显示第 {startIndex + 1} - {endIndex} 条，共 {totalCount} 条
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          className="px-2 py-1 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors border border-border bg-card"
        >
          上一页
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-2 py-1 rounded text-xs transition-colors border ${
              currentPage === page
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted border-border bg-card"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="px-2 py-1 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors border border-border bg-card"
        >
          下一页
        </button>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="ml-2 px-2 py-1 rounded text-xs outline-none hover:border-primary transition-colors cursor-pointer appearance-none"
          style={{ background: "#1E293B", border: "1px solid rgba(148, 163, 184, 0.12)", color: "#fff" }}
        >
          <option value={5} style={{ color: "#fff", background: "#1E293B" }}>5条/页</option>
          <option value={10} style={{ color: "#fff", background: "#1E293B" }}>10条/页</option>
          <option value={20} style={{ color: "#fff", background: "#1E293B" }}>20条/页</option>
          <option value={50} style={{ color: "#fff", background: "#1E293B" }}>50条/页</option>
        </select>
      </div>
    </div>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  loading?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "搜索...",
  loading = false,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 h-8 rounded-md flex-1 max-w-xs bg-input border border-border">
      <Search size={13} className="text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none text-xs flex-1 text-foreground placeholder:text-muted-foreground"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="hover:text-foreground text-muted-foreground"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

interface FilterDropdownProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FilterDropdown({
  value,
  options,
  onChange,
  placeholder = "筛选",
}: FilterDropdownProps) {
  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-md text-xs hover:border-primary transition-colors cursor-pointer outline-none appearance-none"
      style={{ minWidth: "120px", background: "#1E293B", border: "1px solid rgba(148, 163, 184, 0.12)", color: "#fff" }}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          style={{ color: "#fff", background: "#1E293B", padding: "8px 12px" }}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}
