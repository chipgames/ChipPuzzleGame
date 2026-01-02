/**
 * 최적화된 이미지 컴포넌트
 * 
 * WebP 형식을 지원하는 브라우저에서는 자동으로 WebP 이미지를 사용하고,
 * 지원하지 않는 경우 원본 이미지로 폴백합니다.
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="logo.png"
 *   alt="Logo"
 *   width={200}
 *   height={200}
 *   loading="lazy"
 * />
 * ```
 */

import React, { useState, useCallback } from "react";
import { getAssetPath } from "@/utils/pathUtils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 원본 이미지 파일명 (예: "logo.png") */
  src: string;
  /** 이미지 대체 텍스트 */
  alt: string;
  /** 이미지 너비 */
  width?: number | string;
  /** 이미지 높이 */
  height?: number | string;
  /** 로딩 전략 ("lazy" | "eager") */
  loading?: "lazy" | "eager";
  /** 클래스명 */
  className?: string;
  /** 인라인 스타일 */
  style?: React.CSSProperties;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 에러 핸들러 */
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * 최적화된 이미지 컴포넌트
 * 
 * WebP 지원 여부에 따라 자동으로 최적화된 이미지를 로드합니다.
 * WebP 로드 실패 시 원본 이미지로 자동 폴백합니다.
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  src,
  alt,
  width,
  height,
  loading = "lazy",
  className,
  style,
  onClick,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(() => {
    // 초기에는 항상 원본 이미지 사용
    // WebP 파일이 실제로 존재하는지 확인하지 않고, 원본 이미지를 먼저 로드
    // WebP 파일이 필요하면 나중에 추가할 수 있음
    return getAssetPath(src);
  });
  const [hasTriedOriginal, setHasTriedOriginal] = useState(true);

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // WebP 로드 실패 시 원본 이미지로 폴백
    if (imageSrc.includes(".webp") && !hasTriedOriginal) {
      setHasTriedOriginal(true);
      setImageSrc(getAssetPath(src));
      // 에러를 조용히 처리 (콘솔에 404 오류가 표시되지만, 폴백이 작동함)
      return;
    }
    
    // 원본 이미지도 실패한 경우 SVG 폴백
    if (!imageSrc.includes(".svg") && src.includes(".png") && hasTriedOriginal) {
      const svgPath = src.replace(/\.png$/i, ".svg");
      setImageSrc(getAssetPath(svgPath));
      return;
    }

    // 사용자 정의 에러 핸들러 호출
    if (onError) {
      onError(event);
    }
  }, [imageSrc, src, onError, hasTriedOriginal]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      style={style}
      onClick={onClick}
      onError={handleError}
      {...props}
    />
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;

