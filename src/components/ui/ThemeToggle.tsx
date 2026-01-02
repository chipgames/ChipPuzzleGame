/**
 * 테마 토글 버튼 컴포넌트
 */

import React, { memo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import "./ThemeToggle.css";

const ThemeToggle: React.FC = memo(() => {
  const { toggleTheme, isLight } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={isLight ? t("header.darkMode") : t("header.lightMode")}
      aria-label={isLight ? t("header.darkMode") : t("header.lightMode")}
    >
      {isLight ? "🌙" : "☀️"}
    </button>
  );
});

ThemeToggle.displayName = "ThemeToggle";

export default ThemeToggle;

