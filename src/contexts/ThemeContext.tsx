import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to safely get initial theme from localStorage (SSR-safe)
function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "system"; // Default for SSR
  }
  const stored = localStorage.getItem("nixelo-theme");
  return (stored as Theme) || "system";
}

// Helper to get initial effective theme (SSR-safe)
function getInitialEffectiveTheme(theme: Theme): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light"; // Default for SSR
  }
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

/**
 * Provides theme context to the application, managing light/dark mode state.
 * Syncs with localStorage and respects system preferences when set to "system".
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(() =>
    getInitialEffectiveTheme(theme),
  );

  useEffect(() => {
    const root = document.documentElement;

    if (effectiveTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [effectiveTheme]);

  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e: MediaQueryListEvent) => {
        setEffectiveTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);
      setEffectiveTheme(mediaQuery.matches ? "dark" : "light");

      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("nixelo-theme", newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context. Returns current theme, effective theme, and setter.
 * Must be used within a ThemeProvider.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
