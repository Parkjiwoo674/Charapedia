import { useState } from "react";

interface CustomTheme {
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

interface Props {
  onClose: () => void;
  onApply: (theme: CustomTheme) => void;
  currentCustom?: CustomTheme;
}

const DEFAULT_CUSTOM: CustomTheme = {
  bg: "#faf8fc",
  surface: "#ffffff",
  ink: "#241a30",
  muted: "#7d7189",
  primary: "#4a2c6d",
  primaryDark: "#34204e",
  gold: "#c9972e",
  goldDark: "#a97c1f",
  rose: "#b4536f",
  border: "#e8e1f0",
};

const PRESETS = {
  light: DEFAULT_CUSTOM,
  dark: {
    bg: "#10132b",
    surface: "#1b2044",
    ink: "#eceaf7",
    muted: "#9691c4",
    primary: "#8b7cf6",
    primaryDark: "#6a5cd6",
    gold: "#e0b84c",
    goldDark: "#c79a2f",
    rose: "#ff8fa3",
    border: "#2b2f58",
  },
  pink: {
    bg: "#0d0d10",
    surface: "#19161c",
    ink: "#f6ecf3",
    muted: "#a58fa0",
    primary: "#ff4fa3",
    primaryDark: "#e0388c",
    gold: "#ff9ecf",
    goldDark: "#ff6fb8",
    rose: "#ff4fa3",
    border: "#322530",
  },
  splash: {
    bg: "#f2fbf9",
    surface: "#ffffff",
    ink: "#123a3a",
    muted: "#5b8888",
    primary: "#0ea5e9",
    primaryDark: "#0284c7",
    gold: "#22c55e",
    goldDark: "#16a34a",
    rose: "#f97316",
    border: "#d6f0e8",
  },
};

export function ThemeEditor({ onClose, onApply, currentCustom }: Props) {
  const [tab, setTab] = useState<"colors" | "background" | "advanced">("colors");
  const [theme, setTheme] = useState<CustomTheme>(currentCustom || DEFAULT_CUSTOM);
  const [imageUrl, setImageUrl] = useState(theme.backgroundImage || "");
  const [opacity, setOpacity] = useState(theme.backgroundOpacity || 0.9);

  const handleColorChange = (key: keyof CustomTheme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const loadPreset = (preset: keyof typeof PRESETS) => {
    setTheme(PRESETS[preset]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImageUrl(url);
        setTheme((prev) => ({ ...prev, backgroundImage: url, backgroundOpacity: opacity }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    onApply({
      ...theme,
      backgroundImage: imageUrl || undefined,
      backgroundOpacity: imageUrl ? opacity : undefined,
    });
    onClose();
  };

  const exportTheme = () => {
    const json = JSON.stringify(theme, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "custom-theme.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setTheme(imported);
          setImageUrl(imported.backgroundImage || "");
          setOpacity(imported.backgroundOpacity || 0.9);
        } catch (err) {
          alert("잘못된 테마 파일입니다.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="theme-editor-overlay" onClick={onClose}>
      <div className="theme-editor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="theme-editor-header">
          <h3>커스텀 테마 에디터</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="theme-editor-tabs">
          <button
            className={tab === "colors" ? "active" : ""}
            onClick={() => setTab("colors")}
          >
            🎨 색상
          </button>
          <button
            className={tab === "background" ? "active" : ""}
            onClick={() => setTab("background")}
          >
            🖼️ 배경
          </button>
          <button
            className={tab === "advanced" ? "active" : ""}
            onClick={() => setTab("advanced")}
          >
            ⚙️ 고급
          </button>
        </div>

        <div className="theme-editor-content">
          {tab === "colors" && (
            <div className="color-picker-grid">
              <div className="preset-section">
                <label>프리셋 불러오기</label>
                <div className="preset-buttons">
                  <button onClick={() => loadPreset("light")}>☀️ 라이트</button>
                  <button onClick={() => loadPreset("dark")}>🌙 다크</button>
                  <button onClick={() => loadPreset("pink")}>💗 핑크</button>
                  <button onClick={() => loadPreset("splash")}>🎨 스플래시</button>
                </div>
              </div>

              {Object.keys(theme)
                .filter((k) => !k.includes("background") && !k.includes("Opacity"))
                .map((key) => (
                  <div key={key} className="color-input-row">
                    <label>{key}</label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        value={theme[key as keyof CustomTheme] as string}
                        onChange={(e) =>
                          handleColorChange(key as keyof CustomTheme, e.target.value)
                        }
                      />
                      <input
                        type="text"
                        value={theme[key as keyof CustomTheme] as string}
                        onChange={(e) =>
                          handleColorChange(key as keyof CustomTheme, e.target.value)
                        }
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === "background" && (
            <div className="background-section">
              <div className="bg-upload">
                <label>배경 이미지 업로드</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>

              <div className="bg-url">
                <label>또는 이미지 URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setTheme((prev) => ({
                      ...prev,
                      backgroundImage: e.target.value,
                      backgroundOpacity: opacity,
                    }));
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {imageUrl && (
                <>
                  <div className="bg-opacity">
                    <label>오버레이 투명도: {opacity.toFixed(2)}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setOpacity(val);
                        setTheme((prev) => ({ ...prev, backgroundOpacity: val }));
                      }}
                    />
                  </div>

                  <div className="bg-preview">
                    <label>미리보기</label>
                    <div
                      className="preview-box"
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: theme.bg,
                          opacity: opacity,
                        }}
                      />
                      <span style={{ position: "relative", color: theme.ink }}>
                        샘플 텍스트
                      </span>
                    </div>
                  </div>

                  <button
                    className="remove-bg-btn"
                    onClick={() => {
                      setImageUrl("");
                      setTheme((prev) => ({
                        ...prev,
                        backgroundImage: undefined,
                        backgroundOpacity: undefined,
                      }));
                    }}
                  >
                    배경 이미지 제거
                  </button>
                </>
              )}
            </div>
          )}

          {tab === "advanced" && (
            <div className="advanced-section">
              <div className="json-editor">
                <label>CSS 변수 JSON</label>
                <textarea
                  value={JSON.stringify(theme, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setTheme(parsed);
                    } catch {
                      // 파싱 실패 시 무시
                    }
                  }}
                  rows={15}
                />
              </div>

              <div className="import-export">
                <label htmlFor="import-theme" className="import-btn">
                  📥 테마 가져오기
                </label>
                <input
                  id="import-theme"
                  type="file"
                  accept=".json"
                  onChange={importTheme}
                  style={{ display: "none" }}
                />
                <button onClick={exportTheme}>📤 테마 내보내기</button>
              </div>
            </div>
          )}
        </div>

        <div className="theme-editor-actions">
          <button className="cancel-btn" onClick={onClose}>
            취소
          </button>
          <button className="apply-btn" onClick={handleApply}>
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
