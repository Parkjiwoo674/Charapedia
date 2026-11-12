import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "pink" | "splash" | "custom";
const STORAGE_KEY = "charapedia_theme";
const CUSTOM_THEME_KEY = "charapedia_custom_theme";

export interface CustomTheme {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  primary: string;
  primaryDark: string;
  gold: string;
  goldDark: string;
  rose: string;
  border: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
}

export const THEME_LIST: { value: Theme; label: string; emoji: string }[] = [
  { value: "light", label: "라이트", emoji: "☀️" },
  { value: "dark", label: "다크", emoji: "🌙" },
  { value: "pink", label: "핑크", emoji: "💗" },
  { value: "splash", label: "스플래시", emoji: "🎨" },
  { value: "custom", label: "커스텀", emoji: "✨" },
];

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "light";
  });

  const [customTheme, setCustomThemeState] = useState<CustomTheme | null>(() => {
    const saved = localStorage.getItem(CUSTOM_THEME_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (theme === "custom" && customTheme) {
      // 커스텀 테마 CSS 변수 적용
      const root = document.documentElement;
      root.setAttribute("data-theme", "custom");
      root.style.setProperty("--bg", customTheme.bg);
      root.style.setProperty("--surface", customTheme.surface);
      root.style.setProperty("--ink", customTheme.ink);
      root.style.setProperty("--muted", customTheme.muted);
      root.style.setProperty("--primary", customTheme.primary);
      root.style.setProperty("--primary-dark", customTheme.primaryDark);
      root.style.setProperty("--gold", customTheme.gold);
      root.style.setProperty("--gold-dark", customTheme.goldDark);
      root.style.setProperty("--rose", customTheme.rose);
      root.style.setProperty("--border", customTheme.border);

      // 배경 이미지 적용
      if (customTheme.backgroundImage) {
        document.body.style.backgroundImage = `url(${customTheme.backgroundImage})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundAttachment = "fixed";
        
        // 오버레이
        const overlay = document.getElementById("bg-overlay");
        if (overlay) {
          overlay.style.opacity = String(customTheme.backgroundOpacity || 0.9);
        } else {
          const div = document.createElement("div");
          div.id = "bg-overlay";
          div.style.cssText = `
            position: fixed;
            inset: 0;
            background: ${customTheme.bg};
            opacity: ${customTheme.backgroundOpacity || 0.9};
            pointer-events: none;
            z-index: -1;
          `;
          document.body.appendChild(div);
        }
      } else {
        document.body.style.backgroundImage = "";
        const overlay = document.getElementById("bg-overlay");
        if (overlay) overlay.remove();
      }
    } else {
      // 프리셋 테마
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.cssText = "";
      document.body.style.backgroundImage = "";
      const overlay = document.getElementById("bg-overlay");
      if (overlay) overlay.remove();
    }

    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, customTheme]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  function setCustomTheme(custom: CustomTheme) {
    setCustomThemeState(custom);
    localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(custom));
    setThemeState("custom");
  }

  return { theme, setTheme, customTheme, setCustomTheme };
}