export const darkTheme = {
  name: "dark",
  colors: {
    background: "#0F172A",
    foreground: "#F8FAFC",
    card: "#1E293B",
    cardForeground: "#F8FAFC",
    primary: "#165DFF",
    primaryForeground: "#FFFFFF",
    secondary: "#334155",
    secondaryForeground: "#F8FAFC",
    muted: "#1E293B",
    mutedForeground: "#94A3B8",
    accent: "#334155",
    accentForeground: "#F8FAFC",
    destructive: "#FF4D4F",
    destructiveForeground: "#FFFFFF",
    border: "#334155",
    input: "#1E293B",
    ring: "#165DFF",
    success: "#00D68F",
    warning: "#FFAA00",
    info: "#165DFF",
    chart: {
      1: "#165DFF",
      2: "#00D68F",
      3: "#FFAA00",
      4: "#FF4D4F",
      5: "#A855F7",
      6: "#06B6D4",
    },
  },
  radius: "0.5rem",
};

export const lightTheme = {
  name: "light",
  colors: {
    background: "#F8FAFC",
    foreground: "#0F172A",
    card: "#FFFFFF",
    cardForeground: "#0F172A",
    primary: "#165DFF",
    primaryForeground: "#FFFFFF",
    secondary: "#E2E8F0",
    secondaryForeground: "#0F172A",
    muted: "#F1F5F9",
    mutedForeground: "#64748B",
    accent: "#E2E8F0",
    accentForeground: "#0F172A",
    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",
    border: "#E2E8F0",
    input: "#F1F5F9",
    ring: "#165DFF",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
    chart: {
      1: "#3B82F6",
      2: "#10B981",
      3: "#F59E0B",
      4: "#EF4444",
      5: "#8B5CF6",
      6: "#06B6D4",
    },
  },
  radius: "0.5rem",
};

export const themes = {
  dark: darkTheme,
  light: lightTheme,
};

export type Theme = typeof darkTheme;

export const getTheme = (themeName: "dark" | "light"): Theme => {
  return themes[themeName] || darkTheme;
};

export const getContrastColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#FFFFFF";
};

export const getOpacityColor = (color: string, opacity: number): string => {
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

export const getGradient = (colors: string[], direction = "to right"): string => {
  return `linear-gradient(${direction}, ${colors.join(", ")})`;
};

export const getStatusColor = (status: "success" | "warning" | "error" | "info" | "default"): string => {
  const colors: Record<string, string> = {
    success: "#00D68F",
    warning: "#FFAA00",
    error: "#FF4D4F",
    info: "#165DFF",
    default: "#94A3B8",
  };
  return colors[status] || colors.default;
};

export const getSeverityColor = (severity: "critical" | "high" | "medium" | "low" | "info"): string => {
  const colors: Record<string, string> = {
    critical: "#FF4D4F",
    high: "#FF6B00",
    medium: "#FFAA00",
    low: "#00D68F",
    info: "#165DFF",
  };
  return colors[severity] || colors.info;
};

export const getHealthColor = (health: number): string => {
  if (health >= 90) return "#00D68F";
  if (health >= 70) return "#FFAA00";
  if (health >= 50) return "#FF6B00";
  return "#FF4D4F";
};

export const getUsageColor = (percentage: number): string => {
  if (percentage >= 90) return "#FF4D4F";
  if (percentage >= 70) return "#FFAA00";
  return "#00D68F";
};
