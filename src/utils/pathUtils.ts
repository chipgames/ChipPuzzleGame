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

/**
 * WebP 형식 지원 여부를 확인합니다.
 * 
 * @returns WebP를 지원하면 true, 그렇지 않으면 false
 * 
 * @example
 * ```typescript
 * if (supportsWebP()) {
 *   // WebP 이미지 사용
 * } else {
 *   // PNG/JPEG 이미지 사용
 * }
 * ```
 */
export function supportsWebP(): boolean {
  // 이미 확인한 경우 캐시된 결과 반환
  if (typeof window !== "undefined" && (window as unknown as { _webpSupport?: boolean })._webpSupport !== undefined) {
    return (window as unknown as { _webpSupport: boolean })._webpSupport;
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const support = canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    
    // 결과를 캐시
    (window as unknown as { _webpSupport: boolean })._webpSupport = support;
    return support;
  } catch {
    return false;
  }
}

/**
 * 이미지 파일명을 WebP 형식으로 변환합니다.
 * 
 * @param filename - 원본 파일명 (예: "logo.png")
 * @returns WebP 파일명 (예: "logo.webp")
 * 
 * @example
 * ```typescript
 * const webpPath = getWebPPath("logo.png"); // "logo.webp"
 * ```
 */
export function getWebPPath(filename: string): string {
  return filename.replace(/\.(png|jpg|jpeg)$/i, ".webp");
}

/**
 * 최적화된 이미지 경로를 반환합니다.
 * WebP를 지원하는 경우 WebP 경로를, 그렇지 않으면 원본 경로를 반환합니다.
 * 
 * @param filename - 원본 파일명 (예: "logo.png")
 * @returns 최적화된 이미지 경로
 * 
 * @example
 * ```typescript
 * const optimizedPath = getOptimizedImagePath("logo.png");
 * // WebP 지원: "/ChipPuzzleGame/logo.webp"
 * // WebP 미지원: "/ChipPuzzleGame/logo.png"
 * ```
 */
export function getOptimizedImagePath(filename: string): string {
  if (supportsWebP()) {
    const webpFilename = getWebPPath(filename);
    return getAssetPath(webpFilename);
  }
  return getAssetPath(filename);
}

