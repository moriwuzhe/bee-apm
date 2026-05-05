import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { themes, defaultTheme, Theme, ThemeColors } from "../config/themes";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const savedThemeId = localStorage.getItem("theme");
      const savedTheme = themes.find((t) => t.id === savedThemeId);
      return savedTheme || defaultTheme;
    }
    return defaultTheme;
  });

  const setTheme = useCallback((themeId: string) => {
    const newTheme = themes.find((t) => t.id === themeId);
    if (newTheme) {
      setThemeState(newTheme);
      localStorage.setItem("theme", themeId);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const colors = theme.colors;
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--foreground", colors.foreground);
    root.style.setProperty("--card", colors.card);
    root.style.setProperty("--card-foreground", colors.cardForeground);
    root.style.setProperty("--popover", colors.popover);
    root.style.setProperty("--popover-foreground", colors.popoverForeground);
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
    root.style.setProperty("--secondary", colors.secondary);
    root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
    root.style.setProperty("--muted", colors.muted);
    root.style.setProperty("--muted-foreground", colors.mutedForeground);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--accent-foreground", colors.accentForeground);
    root.style.setProperty("--destructive", colors.destructive);
    root.style.setProperty("--border", colors.border);
    root.style.setProperty("--input", colors.input);
    root.style.setProperty("--ring", colors.ring);
    root.style.setProperty("--chart-1", colors.chart1);
    root.style.setProperty("--chart-2", colors.chart2);
    root.style.setProperty("--chart-3", colors.chart3);
    root.style.setProperty("--chart-4", colors.chart4);
    root.style.setProperty("--chart-5", colors.chart5);
    root.style.setProperty("--sidebar", colors.sidebar);
    root.style.setProperty("--sidebar-foreground", colors.sidebarForeground);
    root.style.setProperty("--sidebar-primary", colors.sidebarPrimary);
    root.style.setProperty("--sidebar-primary-foreground", colors.sidebarPrimaryForeground);
    root.style.setProperty("--sidebar-accent", colors.sidebarAccent);
    root.style.setProperty("--sidebar-accent-foreground", colors.sidebarAccentForeground);
    root.style.setProperty("--sidebar-border", colors.sidebarBorder);
    root.style.setProperty("--sidebar-ring", colors.sidebarRing);
    root.style.setProperty("--panel", colors.panel);
    root.style.setProperty("--panel-border", colors.panelBorder);
    root.style.setProperty("--status-green", colors.statusGreen);
    root.style.setProperty("--status-yellow", colors.statusYellow);
    root.style.setProperty("--status-red", colors.statusRed);
    root.style.setProperty("--tech-blue", colors.techBlue);
    root.style.setProperty("--tech-blue-dim", colors.techBlueDim);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, colors: theme.colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;