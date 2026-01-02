/**
 * 테마 관리 훅
 * 
 * 라이트/다크 모드 전환 및 테마 설정 관리
 */

import { useState, useEffect, useCallback } from "react";
import { storageManager } from "@/utils/storage";
import { logger } from "@/utils/logger";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "chipPuzzleGame_theme";

/**
 * 시스템 테마 감지
 */
const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";
  
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
};

/**
 * 테마 적용
 */
const applyTheme = (theme: Theme): void => {
  if (typeof document === "undefined") return;
  
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  
  // 메타 테마 컬러 업데이트 (모바일 브라우저용)
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      "content",
      theme === "light" ? "#f5f5f5" : "#0f0f1e"
    );
  }
};

/**
 * 테마 관리 훅
 * 
 * @returns 테마 상태 및 전환 함수
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 저장된 테마가 있으면 사용, 없으면 시스템 테마 사용
    const savedTheme = storageManager.get<Theme>(THEME_STORAGE_KEY, {
      fallback: null,
      silent: true,
    });
    
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    
    return getSystemTheme();
  });

  // 테마 변경 함수
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      storageManager.set(THEME_STORAGE_KEY, newTheme, { silent: true });
      applyTheme(newTheme);
      logger.debug("Theme changed", { theme: newTheme });
      return newTheme;
    });
  }, []);

  // 테마 설정 함수
  const setThemeValue = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    storageManager.set(THEME_STORAGE_KEY, newTheme, { silent: true });
    applyTheme(newTheme);
    logger.debug("Theme set", { theme: newTheme });
  }, []);

  // 초기 테마 적용
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    
    // 저장된 테마가 없을 때만 시스템 테마 변경 감지
    const savedTheme = storageManager.get<Theme>(THEME_STORAGE_KEY, {
      fallback: null,
      silent: true,
    });

    if (!savedTheme) {
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? "light" : "dark";
        setThemeValue(newTheme);
      };

      // MediaQueryList.addEventListener는 일부 브라우저에서 지원되지 않을 수 있음
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
        return () => {
          mediaQuery.removeEventListener("change", handleChange);
        };
      } else {
        // 구형 브라우저 지원
        mediaQuery.addListener(handleChange);
        return () => {
          mediaQuery.removeListener(handleChange);
        };
      }
    }
  }, [setThemeValue]);

  return {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
    isLight: theme === "light",
    isDark: theme === "dark",
  };
};

