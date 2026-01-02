/**
 * Google AdSense 타입 정의
 */

declare global {
  interface Window {
    /**
     * AdSense 광고 배열
     */
    adsbygoogle?: AdSenseConfig[];
  }
}

/**
 * AdSense 설정 인터페이스
 */
export interface AdSenseConfig {
  /** Google AdSense 클라이언트 ID */
  google_ad_client?: string;
  /** 페이지 레벨 광고 활성화 */
  enable_page_level_ads?: boolean;
  [key: string]: unknown;
}

/**
 * Performance Memory 인터페이스 (Chrome 전용)
 */
export interface PerformanceMemory {
  /** 사용 중인 JS 힙 크기 (바이트) */
  usedJSHeapSize: number;
  /** 전체 JS 힙 크기 (바이트) */
  totalJSHeapSize: number;
  /** JS 힙 크기 제한 (바이트) */
  jsHeapSizeLimit: number;
}

/**
 * Performance 인터페이스 확장
 */
declare global {
  interface Performance {
    /** 메모리 정보 (Chrome에서만 사용 가능) */
    memory?: PerformanceMemory;
  }
}

export {};

