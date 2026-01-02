/**
 * 테마 색상 유틸리티
 * CSS 변수를 JavaScript에서 읽어오는 헬퍼 함수
 */

/**
 * CSS 변수 값을 가져옵니다.
 * 
 * @param variableName - CSS 변수 이름 (예: '--bg-primary')
 * @param fallback - 변수를 찾을 수 없을 때 사용할 기본값
 * @returns CSS 변수 값 또는 기본값
 */
export const getCSSVariable = (variableName: string, fallback: string = ""): string => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallback;
  }
  
  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(variableName).trim();
  
  return value || fallback;
};

/**
 * 테마별 색상 값을 가져옵니다.
 */
export const getThemeColors = () => {
  return {
    bgPrimary: getCSSVariable("--bg-primary", "#1a1a2e"),
    bgSecondary: getCSSVariable("--bg-secondary", "#2a2a3e"),
    bgCard: getCSSVariable("--bg-card", "rgba(42, 42, 62, 0.9)"),
    textPrimary: getCSSVariable("--text-primary", "#ffffff"),
    textSecondary: getCSSVariable("--text-secondary", "rgba(255, 255, 255, 0.85)"),
    accentPrimary: getCSSVariable("--accent-primary", "#a8b5ff"),
    accentSecondary: getCSSVariable("--accent-secondary", "#c5a3ff"),
    accentSuccess: getCSSVariable("--accent-success", "#7fdfd4"),
    accentWarning: getCSSVariable("--accent-warning", "#ffd89b"),
    accentDanger: getCSSVariable("--accent-danger", "#ff9f9f"),
    borderColor: getCSSVariable("--border-color", "rgba(255, 255, 255, 0.15)"),
    canvasBg: getCSSVariable("--canvas-bg", "#1a1a1a"),
  };
};

/**
 * RGB 색상을 rgba로 변환합니다.
 * 
 * @param hex - HEX 색상 코드 (예: '#ffffff')
 * @param alpha - 알파 값 (0-1)
 * @returns rgba 색상 문자열
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

