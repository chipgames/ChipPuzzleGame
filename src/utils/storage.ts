/**
 * LocalStorage 유틸리티
 * 에러 처리, fallback, 타입 안정성 포함
 */

import { logger } from "./logger";
import { StorageData, GameProgress } from "@/types/storage";
import { StageRecord } from "@/types/stage";

interface StorageOptions {
  fallback?: any;
  silent?: boolean; // 에러를 조용히 처리할지 여부
}

/**
 * LocalStorage 데이터 검증 함수
 */
function validateStorageData(data: any): data is StorageData {
  if (!data || typeof data !== "object") {
    return false;
  }

  // version 검증
  if (typeof data.version !== "string" || !data.version) {
    return false;
  }

  // progress 검증
  if (!data.progress || typeof data.progress !== "object") {
    return false;
  }

  if (typeof data.progress.highestStage !== "number" || data.progress.highestStage < 1) {
    return false;
  }

  if (!data.progress.stageRecords || typeof data.progress.stageRecords !== "object") {
    return false;
  }

  // stageRecords 검증
  for (const key in data.progress.stageRecords) {
    const record = data.progress.stageRecords[key];
    if (!record || typeof record !== "object") {
      return false;
    }
    // StageRecord의 기본 필드 검증
    if (typeof record.stageNumber !== "number" || record.stageNumber < 1) {
      return false;
    }
  }

  // settings 검증 (선택적)
  if (data.settings !== undefined) {
    if (typeof data.settings !== "object" || data.settings === null) {
      return false;
    }
    if (data.settings.language !== undefined && typeof data.settings.language !== "string") {
      return false;
    }
    if (data.settings.soundEnabled !== undefined && typeof data.settings.soundEnabled !== "boolean") {
      return false;
    }
  }

  return true;
}

/**
 * GameProgress 검증 함수
 */
function validateGameProgress(data: any): data is GameProgress {
  if (!data || typeof data !== "object") {
    return false;
  }

  if (typeof data.highestStage !== "number" || data.highestStage < 1 || data.highestStage > 1000) {
    return false;
  }

  if (!data.stageRecords || typeof data.stageRecords !== "object") {
    return false;
  }

  return true;
}

/**
 * 안전한 문자열 검증 (XSS 방지)
 */
function sanitizeString(value: any): string | null {
  if (typeof value !== "string") {
    return null;
  }

  // 위험한 문자 패턴 제거
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror 등
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
  ];

  let sanitized = value;
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, "");
  }

  // 최대 길이 제한 (10KB)
  if (sanitized.length > 10 * 1024) {
    return null;
  }

  return sanitized;
}

class StorageManager {
  private isAvailable(): boolean {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * LocalStorage에서 값 가져오기
   */
  public get<T>(key: string, options: StorageOptions = {}): T | null {
    if (!this.isAvailable()) {
      if (!options.silent) {
        logger.warn("LocalStorage is not available", { key });
      }
      return options.fallback ?? null;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return options.fallback ?? null;
      }
      
      // JSON 파싱 시도
      let parsed: any;
      try {
        parsed = JSON.parse(item);
      } catch (parseError) {
        // JSON이 아닌 경우 (예: 이전에 문자열로 저장된 경우)
        // 문자열로 저장된 값이면 그대로 반환
        if (typeof item === "string" && item.startsWith('"') && item.endsWith('"')) {
          // JSON 문자열로 감싸진 경우
          parsed = JSON.parse(item);
        } else if (typeof options.fallback === "string") {
          // 순수 문자열인 경우 타입에 맞게 반환
          return item as T;
        } else {
          // 파싱 실패 시 오래된 데이터로 간주하고 제거
          localStorage.removeItem(key);
          if (!options.silent) {
            logger.warn("Removed invalid storage data", { key, value: item });
          }
          return options.fallback ?? null;
        }
      }

      // 게임 데이터인 경우 검증 수행
      if (key.startsWith("chipPuzzleGame_")) {
        if (key === "chipPuzzleGame_progress") {
          if (!validateGameProgress(parsed)) {
            logger.warn("Invalid game progress data, removing", { key });
            localStorage.removeItem(key);
            return options.fallback ?? null;
          }
        } else if (key === "chipPuzzleGame_data") {
          if (!validateStorageData(parsed)) {
            logger.warn("Invalid storage data, removing", { key });
            localStorage.removeItem(key);
            return options.fallback ?? null;
          }
        }
      }

      return parsed as T;
    } catch (error) {
      // SyntaxError는 silent 옵션에 따라 처리
      if (error instanceof SyntaxError && options.silent) {
        return options.fallback ?? null;
      }
      if (!options.silent) {
        logger.error("Failed to get item from LocalStorage", {
          key,
          error,
        });
      }
      return options.fallback ?? null;
    }
  }

  /**
   * LocalStorage에 값 저장하기
   */
  public set<T>(
    key: string,
    value: T,
    options: Omit<StorageOptions, "fallback"> = {}
  ): boolean {
    if (!this.isAvailable()) {
      if (!options.silent) {
        logger.warn("LocalStorage is not available", { key });
      }
      return false;
    }

    try {
      // 게임 데이터인 경우 검증 수행
      if (key.startsWith("chipPuzzleGame_")) {
        if (key === "chipPuzzleGame_progress") {
          if (!validateGameProgress(value)) {
            logger.error("Invalid game progress data, not saving", { key, value });
            return false;
          }
        } else if (key === "chipPuzzleGame_data") {
          if (!validateStorageData(value)) {
            logger.error("Invalid storage data, not saving", { key, value });
            return false;
          }
        }
      }

      // 문자열 값인 경우 sanitization 수행
      if (typeof value === "string") {
        const sanitized = sanitizeString(value);
        if (sanitized === null) {
          logger.error("String value failed sanitization", { key });
          return false;
        }
        value = sanitized as T;
      }

      const serialized = JSON.stringify(value);
      
      // 용량 체크 (5MB 제한)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (serialized.length > MAX_SIZE) {
        logger.error("Storage size exceeds limit", {
          key,
          size: serialized.length,
          maxSize: MAX_SIZE,
        });
        return false;
      }

      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      logger.error("Failed to set item to LocalStorage", {
        key,
        error,
      });
      return false;
    }
  }

  /**
   * LocalStorage에서 값 제거하기
   */
  public remove(key: string, options: StorageOptions = {}): boolean {
    if (!this.isAvailable()) {
      if (!options.silent) {
        logger.warn("LocalStorage is not available", { key });
      }
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error("Failed to remove item from LocalStorage", {
        key,
        error,
      });
      return false;
    }
  }

  /**
   * LocalStorage 전체 비우기 (게임 데이터만)
   */
  public clearGameData(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const keys = Object.keys(localStorage);
      const gameKeys = keys.filter((key) =>
        key.startsWith("chipPuzzleGame_")
      );
      gameKeys.forEach((key) => localStorage.removeItem(key));
      logger.info("Game data cleared", { count: gameKeys.length });
      return true;
    } catch (error) {
      logger.error("Failed to clear game data", { error });
      return false;
    }
  }

  /**
   * LocalStorage 사용 가능 여부 확인
   */
  public available(): boolean {
    return this.isAvailable();
  }
}

export const storageManager = new StorageManager();

// 편의 함수들
export const getStorage = <T>(key: string, fallback?: T): T | null => {
  return storageManager.get<T>(key, { fallback });
};

export const setStorage = <T>(key: string, value: T): boolean => {
  return storageManager.set(key, value);
};

export const removeStorage = (key: string): boolean => {
  return storageManager.remove(key);
};

