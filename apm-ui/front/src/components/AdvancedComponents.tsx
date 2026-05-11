import React from "react";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  showPercentage?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  color = "#165DFF",
  bgColor = "rgba(148,163,184,0.1)",
  label,
  showPercentage = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-lg font-bold" style={{ color }}>
            {progress}%
          </span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
};

interface StatusIndicatorProps {
  status: "healthy" | "warning" | "critical" | "offline" | "unknown";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = "md",
  pulse = false,
  label,
}) => {
  const sizeMap = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const colorMap = {
    healthy: "bg-green-500",
    warning: "bg-yellow-500",
    critical: "bg-red-500",
    offline: "bg-gray-500",
    unknown: "bg-blue-500",
  };

  const labelColorMap = {
    healthy: "text-green-400",
    warning: "text-yellow-400",
    critical: "text-red-400",
    offline: "text-gray-400",
    unknown: "text-blue-400",
  };

  const statusLabelMap = {
    healthy: "健康",
    warning: "警告",
    critical: "危急",
    offline: "离线",
    unknown: "未知",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${sizeMap[size]}`}>
        <div className={`absolute inset-0 rounded-full ${colorMap[status]} ${pulse ? "animate-ping opacity-75" : ""}`} />
        <div className={`relative ${sizeMap[size]} rounded-full ${colorMap[status]}`} />
      </div>
      {label && (
        <span className={`text-xs ${labelColorMap[status]}`}>
          {label || statusLabelMap[status]}
        </span>
      )}
    </div>
  );
};

interface CountUpProps {
  value: number;
  duration?: number;
  separator?: string;
  prefix?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 2000,
  separator = ",",
  prefix = "",
  suffix = "",
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const startTime = React.useRef<number | null>(null);
  const animationRef = React.useRef<number>();

  React.useEffect(() => {
    startTime.current = null;

    const animate = (currentTime: number) => {
      if (!startTime.current) startTime.current = currentTime;
      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = displayValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return (
    <span>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
};

interface TrendIndicatorProps {
  value: number;
  unit?: string;
  positiveIsGood?: boolean;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  unit = "%",
  positiveIsGood = false,
}) => {
  const isPositive = value > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const color = isGood ? "text-green-400" : "text-red-400";
  const icon = isPositive ? "↑" : "↓";

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
      <span>{icon}</span>
      <span>{Math.abs(value)}{unit}</span>
    </span>
  );
};

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  animate?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = "100%",
  height = "1rem",
  borderRadius = "0.25rem",
  animate = true,
}) => {
  return (
    <div
      className={`bg-muted ${animate ? "animate-pulse" : ""}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
      }}
    />
  );
};

interface DataTableProps {
  columns: Array<{
    key: string;
    header: string;
    width?: string | number;
    align?: "left" | "center" | "right";
    render?: (value: any, record: any) => React.ReactNode;
  }>;
  data: any[];
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (record: any) => void;
  selectedKeys?: Set<string | number>;
  onSelectChange?: (keys: Set<string | number>) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  emptyText = "暂无数据",
  onRowClick,
  selectedKeys,
  onSelectChange,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {selectedKeys !== undefined && onSelectChange && (
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedKeys.size === data.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectChange(new Set(data.map((_, i) => i)));
                    } else {
                      onSelectChange(new Set());
                    }
                  }}
                  className="rounded"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                style={{
                  width: col.width ? (typeof col.width === "number" ? `${col.width}px` : col.width) : undefined,
                  textAlign: col.align || "left",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {selectedKeys !== undefined && (
                  <td className="px-4 py-3">
                    <LoadingSkeleton width={16} height={16} />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <LoadingSkeleton height={16} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectedKeys !== undefined ? 1 : 0)}
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={index}
                className={`border-b border-border hover:bg-muted/50 transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(record)}
              >
                {selectedKeys !== undefined && onSelectChange && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(index)}
                      onChange={(e) => {
                        const newKeys = new Set(selectedKeys);
                        if (e.target.checked) {
                          newKeys.add(index);
                        } else {
                          newKeys.delete(index);
                        }
                        onSelectChange(newKeys);
                      }}
                      className="rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm"
                    style={{ textAlign: col.align || "left" }}
                  >
                    {col.render ? col.render(record[col.key], record) : record[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
