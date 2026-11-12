import { useState } from "react";
import { THEME_LIST, Theme } from "../hooks/useTheme";
import { ThemeEditor } from "./ThemeEditor";
import type { CustomTheme } from "../hooks/useTheme";

interface Props {
  theme: Theme;
  setTheme: (t: Theme) => void;
  setCustomTheme: (custom: CustomTheme) => void;
  variant: "floating" | "inline";
}

export function ThemeSwitcher({ theme, setTheme, setCustomTheme, variant }: Props) {
  const [open, setOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const current = THEME_LIST.find((t) => t.value === theme) ?? THEME_LIST[0];

  const handleThemeClick = (value: Theme) => {
    if (value === "custom") {
      setShowEditor(true);
      setOpen(false);
    } else {
      setTheme(value);
      setOpen(false);
    }
  };

  return (
    <>
      <div className={`theme-switcher ${variant}`}>
        <button
          type="button"
          className={`theme-toggle ${variant}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="테마 선택"
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{current.emoji}</span>
        </button>
        {open && (
          <div className="theme-menu">
            {THEME_LIST.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`theme-option ${theme === t.value ? "active" : ""}`}
                onClick={() => handleThemeClick(t.value)}
                title={t.label}
              >
                <span style={{ fontSize: '18px' }}>{t.emoji}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <ThemeEditor
          onClose={() => setShowEditor(false)}
          onApply={setCustomTheme}
        />
      )}
    </>
  );
}