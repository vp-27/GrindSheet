import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { updateFavicon } from "@/utils/manifestUtils";

type Theme = "light" | "dark" | "system";
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const getInitialTheme = (): Theme => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* Theme still works when persistent storage is unavailable. */
  }
  return "system";
};
const systemIsDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [systemDark, setSystemDark] = useState(systemIsDark);
  const isDark = theme === "dark" || (theme === "system" && systemDark);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* Use the in-memory preference. */
    }
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
    root.style.background = isDark ? "#000000" : "#f8fafc";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", isDark ? "#000000" : "#f8fafc");
    updateFavicon(isDark);
  }, [theme, isDark]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
