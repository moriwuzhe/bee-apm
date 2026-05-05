interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export default function Loading({ size = "md", text, fullScreen = false }: LoadingProps) {
  const sizeMap = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <div className="text-sm" style={{ color: "#94A3B8" }}>
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
}

interface SkeletonProps {
  rows?: number;
  height?: string;
}

export function Skeleton({ rows = 5, height = "h-4" }: SkeletonProps) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`${height} rounded`}
          style={{ background: "rgba(148, 163, 184, 0.1)" }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ columns = 5, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse p-4">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded flex-1"
            style={{ background: "rgba(148, 163, 184, 0.1)" }}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-8 rounded flex-1"
              style={{ background: "rgba(148, 163, 184, 0.08)" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}
