/**
 * 성능 분석 유틸리티
 * Web Vitals 및 성능 메트릭을 수집하고 분석합니다.
 */

import { logger } from "./logger";
import type { WebVitalsMetric } from "./webVitals";
import type { PerformanceMetrics } from "./performance";

/**
 * 성능 메트릭 저장소 인터페이스
 */
interface PerformanceData {
  /** Web Vitals 메트릭 */
  webVitals: WebVitalsMetric[];
  /** 게임 성능 메트릭 */
  gamePerformance: PerformanceMetrics[];
  /** 수집 시작 시간 */
  startTime: number;
  /** 마지막 업데이트 시간 */
  lastUpdate: number;
}

/**
 * 성능 분석 클래스
 */
class PerformanceAnalytics {
  private data: PerformanceData = {
    webVitals: [],
    gamePerformance: [],
    startTime: performance.now(),
    lastUpdate: performance.now(),
  };

  private maxDataSize = 100; // 최대 저장 데이터 수

  /**
   * Web Vitals 메트릭 추가
   * 
   * @param metric - Web Vitals 메트릭
   */
  public addWebVital(metric: WebVitalsMetric): void {
    this.data.webVitals.push(metric);
    
    // 최대 크기 제한
    if (this.data.webVitals.length > this.maxDataSize) {
      this.data.webVitals.shift();
    }

    this.data.lastUpdate = performance.now();

    // 나쁜 점수는 즉시 로깅
    if (metric.rating === "poor") {
      logger.warn(`Poor Web Vital detected: ${metric.name}`, {
        value: metric.value,
        rating: metric.rating,
        threshold: this.getThreshold(metric.name),
      });
    }
  }

  /**
   * 게임 성능 메트릭 추가
   * 
   * @param metric - 게임 성능 메트릭
   */
  public addGamePerformance(metric: PerformanceMetrics): void {
    this.data.gamePerformance.push(metric);
    
    // 최대 크기 제한
    if (this.data.gamePerformance.length > this.maxDataSize) {
      this.data.gamePerformance.shift();
    }

    this.data.lastUpdate = performance.now();
  }

  /**
   * Web Vitals 메트릭 가져오기
   * 
   * @param name - 메트릭 이름 (선택적)
   * @returns Web Vitals 메트릭 배열
   */
  public getWebVitals(name?: string): WebVitalsMetric[] {
    if (name) {
      return this.data.webVitals.filter((m) => m.name === name);
    }
    return [...this.data.webVitals];
  }

  /**
   * 게임 성능 메트릭 가져오기
   * 
   * @returns 게임 성능 메트릭 배열
   */
  public getGamePerformance(): PerformanceMetrics[] {
    return [...this.data.gamePerformance];
  }

  /**
   * 평균 Web Vitals 값 계산
   * 
   * @param name - 메트릭 이름
   * @returns 평균 값 또는 null
   */
  public getAverageWebVital(name: string): number | null {
    const metrics = this.getWebVitals(name);
    if (metrics.length === 0) {
      return null;
    }

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * 최신 Web Vitals 값 가져오기
   * 
   * @param name - 메트릭 이름
   * @returns 최신 메트릭 또는 null
   */
  public getLatestWebVital(name: string): WebVitalsMetric | null {
    const metrics = this.getWebVitals(name);
    if (metrics.length === 0) {
      return null;
    }

    // 가장 최근 메트릭 반환
    return metrics[metrics.length - 1];
  }

  /**
   * 성능 리포트 생성
   * 
   * @returns 성능 리포트 객체
   */
  public generateReport(): {
    webVitals: {
      [key: string]: {
        latest: number | null;
        average: number | null;
        rating: "good" | "needs-improvement" | "poor" | "unknown";
        count: number;
      };
    };
    gamePerformance: {
      averageFPS: number;
      averageFrameTime: number;
      minFPS: number;
      maxFPS: number;
      sampleCount: number;
    };
    sessionDuration: number;
  } {
    const report: {
      webVitals: {
        [key: string]: {
          latest: number | null;
          average: number | null;
          rating: "good" | "needs-improvement" | "poor" | "unknown";
          count: number;
        };
      };
      gamePerformance: {
        averageFPS: number;
        averageFrameTime: number;
        minFPS: number;
        maxFPS: number;
        sampleCount: number;
      };
      sessionDuration: number;
    } = {
      webVitals: {},
      gamePerformance: {
        averageFPS: 0,
        averageFrameTime: 0,
        minFPS: Infinity,
        maxFPS: 0,
        sampleCount: 0,
      },
      sessionDuration: performance.now() - this.data.startTime,
    };

    // Web Vitals 리포트 생성
    const webVitalNames = ["LCP", "FID", "CLS", "FCP", "TTFB"];
    for (const name of webVitalNames) {
      const latest = this.getLatestWebVital(name);
      const average = this.getAverageWebVital(name);
      const metrics = this.getWebVitals(name);

      report.webVitals[name] = {
        latest: latest?.value ?? null,
        average,
        rating: latest?.rating ?? "unknown",
        count: metrics.length,
      };
    }

    // 게임 성능 리포트 생성
    const gameMetrics = this.getGamePerformance();
    if (gameMetrics.length > 0) {
      const fpsValues = gameMetrics.map((m) => m.fps);
      const frameTimeValues = gameMetrics.map((m) => m.frameTime);

      report.gamePerformance = {
        averageFPS: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length,
        averageFrameTime: frameTimeValues.reduce((a, b) => a + b, 0) / frameTimeValues.length,
        minFPS: Math.min(...fpsValues),
        maxFPS: Math.max(...fpsValues),
        sampleCount: gameMetrics.length,
      };
    }

    return report;
  }

  /**
   * 성능 리포트 로깅
   */
  public logReport(): void {
    const report = this.generateReport();
    logger.info("Performance Report", report);
  }

  /**
   * 메트릭 임계값 가져오기
   * 
   * @param name - 메트릭 이름
   * @returns 임계값 객체
   */
  private getThreshold(name: string): { good: number; needsImprovement: number } {
    const thresholds: Record<string, { good: number; needsImprovement: number }> = {
      LCP: { good: 2500, needsImprovement: 4000 },
      FID: { good: 100, needsImprovement: 300 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 },
    };

    return thresholds[name] ?? { good: 0, needsImprovement: 0 };
  }

  /**
   * 데이터 초기화
   */
  public reset(): void {
    this.data = {
      webVitals: [],
      gamePerformance: [],
      startTime: performance.now(),
      lastUpdate: performance.now(),
    };
  }

  /**
   * 모든 데이터 가져오기
   * 
   * @returns 성능 데이터 객체
   */
  public getAllData(): PerformanceData {
    return {
      webVitals: [...this.data.webVitals],
      gamePerformance: [...this.data.gamePerformance],
      startTime: this.data.startTime,
      lastUpdate: this.data.lastUpdate,
    };
  }
}

export const performanceAnalytics = new PerformanceAnalytics();

