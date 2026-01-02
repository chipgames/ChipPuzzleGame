/**
 * Web Vitals 측정 유틸리티
 * Google의 Core Web Vitals 지표를 측정합니다.
 * 
 * 참고: https://web.dev/vitals/
 */

import { logger } from "./logger";
import { performanceAnalytics } from "./performanceAnalytics";

/**
 * Web Vitals 메트릭 타입
 */
export interface WebVitalsMetric {
  /** 메트릭 이름 (LCP, FID, CLS 등) */
  name: string;
  /** 메트릭 값 */
  value: number;
  /** 메트릭 ID (고유 식별자) */
  id: string;
  /** 메트릭이 발생한 시점 */
  delta: number;
  /** 메트릭 레이팅 (good, needs-improvement, poor) */
  rating?: "good" | "needs-improvement" | "poor";
  /** 메트릭이 발생한 시각 */
  timestamp: number;
  /** 추가 메타데이터 */
  entries?: PerformanceEntry[];
}

/**
 * Web Vitals 콜백 타입
 */
export type WebVitalsCallback = (metric: WebVitalsMetric) => void;

/**
 * 개발 환경인지 확인
 */
function isDevelopment(): boolean {
  try {
    if (import.meta.env?.DEV) {
      return true;
    }
  } catch {
    // import.meta.env를 사용할 수 없는 경우
  }
  
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("localhost")
  );
}

/**
 * LCP (Largest Contentful Paint) 측정
 * 
 * 가장 큰 콘텐츠가 렌더링되는 시간을 측정합니다.
 * 좋은 점수: < 2.5초
 * 개선 필요: 2.5초 ~ 4초
 * 나쁜 점수: > 4초
 */
function measureLCP(onPerfEntry: WebVitalsCallback): void {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
      };

      if (lastEntry) {
        const value = lastEntry.renderTime || lastEntry.loadTime || 0;
        const rating = value < 2500 ? "good" : value < 4000 ? "needs-improvement" : "poor";

        onPerfEntry({
          name: "LCP",
          value,
          id: `lcp-${Date.now()}`,
          delta: value,
          rating,
          timestamp: performance.now(),
          entries: [lastEntry],
        });

        observer.disconnect();
      }
    });

    observer.observe({ entryTypes: ["largest-contentful-paint"] });
  } catch (error) {
    if (isDevelopment()) {
      logger.warn("LCP measurement failed", { error });
    }
  }
}

/**
 * FID (First Input Delay) 측정
 * 
 * 첫 사용자 입력 지연 시간을 측정합니다.
 * 좋은 점수: < 100ms
 * 개선 필요: 100ms ~ 300ms
 * 나쁜 점수: > 300ms
 */
function measureFID(onPerfEntry: WebVitalsCallback): void {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEventTiming;

      if (firstEntry) {
        const value = firstEntry.processingStart - firstEntry.startTime;
        const rating = value < 100 ? "good" : value < 300 ? "needs-improvement" : "poor";

        onPerfEntry({
          name: "FID",
          value,
          id: `fid-${Date.now()}`,
          delta: value,
          rating,
          timestamp: performance.now(),
          entries: [firstEntry],
        });

        observer.disconnect();
      }
    });

    observer.observe({ entryTypes: ["first-input"] });
  } catch (error) {
    if (isDevelopment()) {
      logger.warn("FID measurement failed", { error });
    }
  }
}

/**
 * CLS (Cumulative Layout Shift) 측정
 * 
 * 누적 레이아웃 이동을 측정합니다.
 * 좋은 점수: < 0.1
 * 개선 필요: 0.1 ~ 0.25
 * 나쁜 점수: > 0.25
 */
function measureCLS(onPerfEntry: WebVitalsCallback): void {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    return;
  }

  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as LayoutShift[];

      for (const entry of entries) {
        // 레이아웃 이동이 사용자 입력에 의한 것이 아닌 경우만 계산
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }

      // 마지막 엔트리에서 최종 CLS 값 전송
      if (entries.length > 0) {
        const rating = clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor";

        onPerfEntry({
          name: "CLS",
          value: clsValue,
          id: `cls-${Date.now()}`,
          delta: clsValue,
          rating,
          timestamp: performance.now(),
          entries,
        });
      }
    });

    observer.observe({ entryTypes: ["layout-shift"] });

    // 페이지 언로드 시 최종 CLS 값 전송
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const rating = clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor";

        onPerfEntry({
          name: "CLS",
          value: clsValue,
          id: `cls-final-${Date.now()}`,
          delta: clsValue,
          rating,
          timestamp: performance.now(),
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
  } catch (error) {
    if (isDevelopment()) {
      logger.warn("CLS measurement failed", { error });
    }
  }
}

/**
 * FCP (First Contentful Paint) 측정
 * 
 * 첫 콘텐츠가 렌더링되는 시간을 측정합니다.
 * 좋은 점수: < 1.8초
 * 개선 필요: 1.8초 ~ 3초
 * 나쁜 점수: > 3초
 */
function measureFCP(onPerfEntry: WebVitalsCallback): void {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];

      if (firstEntry) {
        const value = firstEntry.startTime;
        const rating = value < 1800 ? "good" : value < 3000 ? "needs-improvement" : "poor";

        onPerfEntry({
          name: "FCP",
          value,
          id: `fcp-${Date.now()}`,
          delta: value,
          rating,
          timestamp: performance.now(),
          entries: [firstEntry],
        });

        observer.disconnect();
      }
    });

    observer.observe({ entryTypes: ["paint"] });
  } catch (error) {
    if (isDevelopment()) {
      logger.warn("FCP measurement failed", { error });
    }
  }
}

/**
 * TTFB (Time to First Byte) 측정
 * 
 * 첫 바이트가 도착하는 시간을 측정합니다.
 * 좋은 점수: < 800ms
 * 개선 필요: 800ms ~ 1.8초
 * 나쁜 점수: > 1.8초
 */
function measureTTFB(onPerfEntry: WebVitalsCallback): void {
  if (typeof window === "undefined" || !("performance" in window)) {
    return;
  }

  try {
    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    
    if (navigationEntry) {
      const value = navigationEntry.responseStart - navigationEntry.requestStart;
      const rating = value < 800 ? "good" : value < 1800 ? "needs-improvement" : "poor";

      onPerfEntry({
        name: "TTFB",
        value,
        id: `ttfb-${Date.now()}`,
        delta: value,
        rating,
        timestamp: performance.now(),
        entries: [navigationEntry],
      });
    }
  } catch (error) {
    if (isDevelopment()) {
      logger.warn("TTFB measurement failed", { error });
    }
  }
}

/**
 * PerformanceEventTiming 인터페이스 확장
 */
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

/**
 * LayoutShift 인터페이스
 */
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

/**
 * Web Vitals 측정 시작
 * 
 * 모든 Core Web Vitals를 측정하고 콜백을 호출합니다.
 * 
 * @param onPerfEntry - 메트릭이 측정될 때 호출되는 콜백 함수
 * 
 * @example
 * ```typescript
 * getWebVitals((metric) => {
 *   console.log(metric.name, metric.value, metric.rating);
 * });
 * ```
 */
export function getWebVitals(onPerfEntry: WebVitalsCallback): void {
  if (typeof window === "undefined") {
    return;
  }

  // Core Web Vitals 측정
  measureLCP(onPerfEntry);
  measureFID(onPerfEntry);
  measureCLS(onPerfEntry);
  
  // 추가 메트릭 측정
  measureFCP(onPerfEntry);
  measureTTFB(onPerfEntry);
}

/**
 * Web Vitals 메트릭을 로깅하는 헬퍼 함수
 * 
 * @param metric - Web Vitals 메트릭
 */
export function logWebVitals(metric: WebVitalsMetric): void {
  // 성능 분석에 추가
  performanceAnalytics.addWebVital(metric);

  if (isDevelopment()) {
    logger.info(`Web Vital: ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      timestamp: metric.timestamp,
    });
  } else {
    // 프로덕션에서는 나쁜 점수만 로깅
    if (metric.rating === "poor") {
      logger.warn(`Poor Web Vital: ${metric.name}`, {
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      });
    }
  }
}

