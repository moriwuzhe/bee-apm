import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({
  title = "指标名称",
  value = "0",
  unit = "",
  trend = 0,
  trendLabel = "",
  color = "#165DFF",
  icon,
  children,
}: {
  title?: string;
  value?: string;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  color?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const isUp = trend > 0;
  const trendColor = isUp ? "#FF4D4F" : "#00D68F";

  return (
    <div
      data-cmp="MetricCard"
      className="rounded-lg p-4 card-hover"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{title}</span>
        {icon && (
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${color}1a` }}>
            <span style={{ color }}>{icon}</span>
          </div>
        )}
      </div>
      <div className="flex items-end gap-1.5 mb-2">
        <span className="text-2xl font-bold" style={{ color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
        {unit && <span className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{unit}</span>}
      </div>
      {(trend !== 0 || trendLabel) && (
        <div className="flex items-center gap-1">
          {trend !== 0 && (isUp ? <TrendingUp size={12} style={{ color: trendColor }} /> : <TrendingDown size={12} style={{ color: trendColor }} />)}
          <span className="text-xs" style={{ color: trendColor }}>{trendLabel || `${Math.abs(trend)}%`}</span>
        </div>
      )}
      {children && <div className="mt-3" data-px-slot>{children}</div>}
    </div>
  );
}
