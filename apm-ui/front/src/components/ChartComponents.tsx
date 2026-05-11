import React from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  showDot?: boolean;
  showArea?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = "#165DFF",
  fillColor,
  strokeWidth = 2,
  showDot = false,
  showArea = true,
}) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = showArea ? `${pathD} L ${width},${height} L 0,${height} Z` : "";

  return (
    <svg width={width} height={height} className="inline-block">
      {showArea && fillColor && (
        <path d={areaD} fill={fillColor} opacity={0.3} />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && (
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r={3}
          fill={color}
        />
      )}
    </svg>
  );
};

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  strokeWidth = 20,
  showLegend = true,
  showLabels = false,
  centerLabel,
  centerValue,
}) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          {data.map((item, index) => {
            const percent = item.value / total;
            const dashLength = percent * circumference;
            const dashOffset = -cumulativePercent * circumference;
            cumulativePercent += percent;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <div className="text-2xl font-bold text-foreground">{centerValue}</div>
            )}
            {centerLabel && (
              <div className="text-xs text-muted-foreground">{centerLabel}</div>
            )}
          </div>
        )}
      </div>
      {showLegend && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-foreground">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                ({((item.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface HeatmapProps {
  data: { x: string; y: string; value: number }[];
  xLabels: string[];
  yLabels: string[];
  colorScale?: string[];
  cellSize?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  xLabels,
  yLabels,
  colorScale = ["#1E293B", "#165DFF", "#00D68F", "#FFAA00", "#FF4D4F"],
  cellSize = 20,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const getColor = (value: number) => {
    const index = Math.floor(((value - minValue) / range) * (colorScale.length - 1));
    return colorScale[Math.min(index, colorScale.length - 1)];
  };

  const getValueMap = () => {
    const map = new Map<string, number>();
    data.forEach((d) => map.set(`${d.x}-${d.y}`, d.value));
    return map;
  };

  const valueMap = getValueMap();

  return (
    <div className="inline-block">
      <div className="flex">
        <div className="mr-2">
          {yLabels.map((label) => (
            <div
              key={label}
              className="flex items-center justify-end text-xs text-muted-foreground"
              style={{ height: cellSize }}
            >
              {label}
            </div>
          ))}
        </div>
        <div>
          <div className="flex">
            {xLabels.map((label) => (
              <div
                key={label}
                className="flex items-center justify-center text-xs text-muted-foreground"
                style={{ width: cellSize }}
              >
                {label}
              </div>
            ))}
          </div>
          {yLabels.map((yLabel) => (
            <div key={yLabel} className="flex">
              {xLabels.map((xLabel) => {
                const value = valueMap.get(`${xLabel}-${yLabel}`) || 0;
                return (
                  <div
                    key={`${xLabel}-${yLabel}`}
                    className="flex items-center justify-center text-xs text-white border border-background"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: getColor(value),
                    }}
                    title={`${xLabel} - ${yLabel}: ${value}`}
                  >
                    {value > 0 && value}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  thresholds?: { value: number; color: string }[];
  label?: string;
  showValue?: boolean;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min = 0,
  max = 100,
  size = 120,
  strokeWidth = 10,
  thresholds = [
    { value: 60, color: "#00D68F" },
    { value: 80, color: "#FFAA00" },
    { value: 100, color: "#FF4D4F" },
  ],
  label,
  showValue = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = ((value - min) / (max - min)) * 100;
  const arcLength = (circumference * 0.75) / 1;
  const offset = arcLength - (percent / 100) * arcLength;

  const getColor = () => {
    for (const threshold of thresholds) {
      if (value <= threshold.value) {
        return threshold.color;
      }
    }
    return thresholds[thresholds.length - 1].color;
  };

  return (
    <div className="relative inline-block">
      <svg width={size} height={size * 0.75} className="-rotate-135">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.2)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end" style={{ paddingBottom: size * 0.1 }}>
        {showValue && (
          <div className="text-2xl font-bold" style={{ color: getColor() }}>
            {value}
          </div>
        )}
        {label && (
          <div className="text-xs text-muted-foreground">{label}</div>
        )}
      </div>
    </div>
  );
};

interface TimelineProps {
  events: {
    time: string;
    title: string;
    description?: string;
    type?: "info" | "success" | "warning" | "error";
  }[];
  direction?: "horizontal" | "vertical";
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  direction = "vertical",
}) => {
  const typeColors = {
    info: "#165DFF",
    success: "#00D68F",
    warning: "#FFAA00",
    error: "#FF4D4F",
  };

  if (direction === "horizontal") {
    return (
      <div className="flex items-center">
        {events.map((event, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: typeColors[event.type || "info"] }}
              />
              <div className="mt-2 text-xs text-muted-foreground">{event.time}</div>
              <div className="mt-1 text-xs font-medium text-foreground max-w-[100px] truncate">
                {event.title}
              </div>
            </div>
            {index < events.length - 1 && (
              <div className="w-16 h-0.5 bg-border" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className="w-3 h-3 rounded-full border-2 border-background"
              style={{ backgroundColor: typeColors[event.type || "info"] }}
            />
            {index < events.length - 1 && <div className="flex-1 w-0.5 bg-border" />}
          </div>
          <div className="pb-4">
            <div className="text-xs text-muted-foreground">{event.time}</div>
            <div className="text-sm font-medium text-foreground">{event.title}</div>
            {event.description && (
              <div className="text-xs text-muted-foreground mt-1">{event.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
