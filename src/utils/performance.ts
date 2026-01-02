/**
 * 성능 모니터링 유틸리티
 * FPS, 렌더링 시간, 메모리 사용량 등을 모니터링
 */

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
  timestamp: number;
}

class PerformanceMonitor {
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private fpsUpdateInterval = 1000; // 1초마다 FPS 업데이트
  private lastFpsUpdate = performance.now();
  private currentFps = 60;
  private currentFrameTime = 16.67; // 60fps 기준
  private maxHistorySize = 60; // 최근 60초간의 데이터

  private callbacks: Set<(metrics: PerformanceMetrics) => void> = new Set();

  /**
   * 프레임 업데이트 호출 (렌더링 루프에서 호출)
   */
  public update() {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // 프레임 시간 기록
    this.frameTimeHistory.push(deltaTime);
    if (this.frameTimeHistory.length > this.maxHistorySize) {
      this.frameTimeHistory.shift();
    }

    this.frameCount++;

    // 1초마다 FPS 계산
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.currentFps = this.frameCount;
      this.currentFrameTime = 1000 / this.currentFps;

      this.fpsHistory.push(this.currentFps);
      if (this.fpsHistory.length > this.maxHistorySize) {
        this.fpsHistory.shift();
      }

      // 평균 프레임 시간 계산
      const avgFrameTime =
        this.frameTimeHistory.reduce((a, b) => a + b, 0) /
        this.frameTimeHistory.length;

      // 메트릭 생성 및 콜백 호출
      const metrics = this.getMetrics(avgFrameTime);
      this.callbacks.forEach((callback) => callback(metrics));

      // 성능 저하 감지
      if (this.currentFps < 30) {
        this.handlePerformanceDegradation();
      }

      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  private getMetrics(avgFrameTime: number): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      fps: this.currentFps,
      frameTime: avgFrameTime,
      timestamp: performance.now(),
    };

    // 메모리 정보 (Chrome에서만 지원)
    if (performance.memory && typeof performance.memory === "object") {
      const memory = performance.memory;
      metrics.memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }

    return metrics;
  }

  private handlePerformanceDegradation() {
    // FPS가 30 이하로 떨어지면 경고
    // 개발 환경에서만 경고 출력 (프로덕션에서는 console이 제거됨)
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Performance degradation detected: FPS = ${this.currentFps.toFixed(1)}`
      );
    }
  }

  /**
   * 성능 메트릭 구독
   */
  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * 현재 FPS 반환
   */
  public getFPS(): number {
    return this.currentFps;
  }

  /**
   * 평균 FPS 반환
   */
  public getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * 현재 프레임 시간 반환 (ms)
   */
  public getFrameTime(): number {
    return this.currentFrameTime;
  }

  /**
   * FPS 히스토리 반환
   */
  public getFPSHistory(): number[] {
    return [...this.fpsHistory];
  }

  /**
   * 메모리 사용량 반환 (지원되는 경우)
   */
  public getMemoryUsage():
    | {
        usedJSHeapSize?: number;
        totalJSHeapSize?: number;
        jsHeapSizeLimit?: number;
      }
    | null {
    if (performance.memory && typeof performance.memory === "object") {
      const memory = performance.memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * 성능 데이터 초기화
   */
  public reset() {
    this.fpsHistory = [];
    this.frameTimeHistory = [];
    this.frameCount = 0;
    this.currentFps = 60;
    this.currentFrameTime = 16.67;
    this.lastFrameTime = performance.now();
    this.lastFpsUpdate = performance.now();
  }
}

export const performanceMonitor = new PerformanceMonitor();

