/**
 * 로깅 유틸리티
 * 개발 환경에서는 상세 로그, 프로덕션에서는 에러만 로깅
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any
  ): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };
  }

  private addToHistory(entry: LogEntry) {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry = this.createLogEntry(level, message, data);
    this.addToHistory(entry);

    // 개발 환경에서만 모든 로그 출력
    // 프로덕션에서는 console이 제거되므로 출력하지 않음
    if (this.isDevelopment) {
      const consoleMethod = console[level] || console.log;
      if (data) {
        consoleMethod(`[${level.toUpperCase()}] ${message}`, data);
      } else {
        consoleMethod(`[${level.toUpperCase()}] ${message}`);
      }
    }
    // 프로덕션에서는 console이 빌드 시 제거되므로 여기서 출력하지 않음

    // 에러는 추가 처리 (예: 에러 리포팅 서비스로 전송)
    if (level === "error") {
      this.handleError(entry);
    }
  }

  private handleError(entry: LogEntry) {
    // 에러 리포팅 서비스로 전송 (예: Sentry, LogRocket 등)
    // 현재는 LocalStorage에 저장만 함
    try {
      const errorLogs = JSON.parse(
        localStorage.getItem("chipPuzzleGame_errorLogs") || "[]"
      );
      errorLogs.push(entry);
      // 최대 50개까지만 저장
      if (errorLogs.length > 50) {
        errorLogs.shift();
      }
      localStorage.setItem(
        "chipPuzzleGame_errorLogs",
        JSON.stringify(errorLogs)
      );
    } catch (e) {
      // LocalStorage 저장 실패 시 조용히 실패
      // 개발 환경에서만 경고 출력
      if (this.isDevelopment) {
        console.warn("Failed to save error log to localStorage", e);
      }
    }
  }

  public debug(message: string, data?: any) {
    this.log("debug", message, data);
  }

  public info(message: string, data?: any) {
    this.log("info", message, data);
  }

  public warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  public error(message: string, data?: any) {
    this.log("error", message, data);
  }

  public getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  public clearHistory() {
    this.logHistory = [];
  }

  public getErrorLogs(): LogEntry[] {
    try {
      return JSON.parse(
        localStorage.getItem("chipPuzzleGame_errorLogs") || "[]"
      );
    } catch {
      return [];
    }
  }

  public clearErrorLogs() {
    try {
      localStorage.removeItem("chipPuzzleGame_errorLogs");
    } catch {
      // 조용히 실패
    }
  }
}

export const logger = new Logger();

