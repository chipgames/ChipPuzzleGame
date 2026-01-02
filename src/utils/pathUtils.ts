/**
 * 경로 유틸리티 함수
 */

/**
 * Base URL을 고려한 파일 경로 생성
 * 
 * Vite의 BASE_URL 환경 변수를 사용하여 올바른 경로를 생성합니다.
 * 
 * @param filename - 파일명 (예: "logo.png")
 * @returns 전체 경로 (예: "/ChipPuzzleGame/logo.png" 또는 "/logo.png")
 * 
 * @example
 * ```typescript
 * const logoPath = getAssetPath("logo.png");
 * // 프로덕션: "/ChipPuzzleGame/logo.png"
 * // 개발: "/logo.png"
 * ```
 */
export function getAssetPath(filename: string): string {
  const baseUrl = import.meta.env?.BASE_URL || "/";
  // baseUrl이 "/"로 끝나지 않으면 "/" 추가
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  // filename이 "/"로 시작하면 제거
  const normalizedFilename = filename.startsWith("/") ? filename.slice(1) : filename;
  return `${normalizedBase}${normalizedFilename}`;
}

