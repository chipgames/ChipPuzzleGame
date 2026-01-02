/**
 * LocalStorage 유틸리티
 * 에러 처리, fallback, 타입 안정성 포함
 */

import { logger } from "./logger";
import { StorageData, GameProgress } from "@/types/storage";
import { StageRecord } from "@/types/stage";
import { memoryStorage } from "./memoryStorage";

/**
 * Storage 옵션 인터페이스
 */
interface StorageOptions {
  /** 키가 없을 때 반환할 기본값 */
  fallback?: unknown;
  /** 에러를 조용히 처리할지 여부 */
  silent?: boolean;
}

/**
 * LocalStorage 데이터 검증 함수
 * 
 * @param data - 검증할 데이터
 * @returns 데이터가 유효한 StorageData이면 true
 */
function validateStorageData(data: unknown): data is StorageData {
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
 * 
 * @param data - 검증할 데이터
 * @returns 데이터가 유효한 GameProgress이면 true
 */
function validateGameProgress(data: unknown): data is GameProgress {
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
 * 
 * @param value - 검증할 값
 * @returns sanitized 문자열 또는 null
 */
function sanitizeString(value: unknown): string | null {
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
  private useMemoryStorage = false;

  private isAvailable(): boolean {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      this.useMemoryStorage = false;
      return true;
    } catch {
      // LocalStorage를 사용할 수 없으면 메모리 저장소 사용
      this.useMemoryStorage = true;
      logger.warn("LocalStorage is not available, using memory storage");
      return false;
    }
  }

  /**
   * LocalStorage 또는 메모리 저장소에서 값 가져오기
   * 
   * LocalStorage를 사용할 수 없으면 자동으로 메모리 저장소를 사용합니다.
   * 게임 데이터인 경우 자동으로 검증을 수행합니다.
   * 
   * @param key - 저장소 키
   * @param options - 옵션 객체
   * @param options.fallback - 키가 없을 때 반환할 기본값
   * @param options.silent - 에러를 조용히 처리할지 여부
   * @returns 저장된 값 또는 null
   * 
   * @example
   * ```typescript
   * // 기본 사용
   * const progress = storageManager.get<GameProgress>("chipPuzzleGame_progress");
   * 
   * // fallback 사용
   * const progress = storageManager.get<GameProgress>("chipPuzzleGame_progress", {
   *   fallback: { highestStage: 1, stageRecords: {} }
   * });
   * ```
   */
  public get<T>(key: string, options: StorageOptions = {}): T | null {
    const available = this.isAvailable();
    
    // LocalStorage를 사용할 수 없으면 메모리 저장소 사용
    if (!available && this.useMemoryStorage) {
      const memoryValue = memoryStorage.get<T>(key);
      if (memoryValue !== null) {
        return memoryValue;
      }
      return options.fallback ?? null;
    }

    if (!available) {
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
      let parsed: unknown;
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
   * LocalStorage 또는 메모리 저장소에 값 저장하기
   * 
   * LocalStorage를 사용할 수 없으면 자동으로 메모리 저장소를 사용합니다.
   * 게임 데이터인 경우 저장 전에 검증을 수행합니다.
   * 문자열 값인 경우 XSS 방지를 위한 sanitization을 수행합니다.
   * 
   * @param key - 저장소 키
   * @param value - 저장할 값
   * @param options - 옵션 객체
   * @param options.silent - 에러를 조용히 처리할지 여부
   * @returns 저장 성공 시 true, 실패 시 false
   * 
   * @example
   * ```typescript
   * const progress: GameProgress = {
   *   highestStage: 5,
   *   stageRecords: { /* ... *\/ }
   * };
   * const success = storageManager.set("chipPuzzleGame_progress", progress);
   * if (!success) {
   *   console.error("저장 실패");
   * }
   * ```
   */
  public set<T>(
    key: string,
    value: T,
    options: Omit<StorageOptions, "fallback"> = {}
  ): boolean {
    const available = this.isAvailable();
    
    // LocalStorage를 사용할 수 없으면 메모리 저장소 사용
    if (!available && this.useMemoryStorage) {
      const result = memoryStorage.set(key, value);
      if (!result && !options.silent) {
        logger.warn("Failed to save to memory storage", { key });
      }
      return result;
    }

    if (!available) {
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
   * 
   * @param key - 제거할 키
   * @param options - 옵션 객체
   * @param options.silent - 에러를 조용히 처리할지 여부
   * @returns 제거 성공 시 true, 실패 시 false
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
   * 
   * "chipPuzzleGame_" 접두사로 시작하는 모든 키를 제거합니다.
   * 
   * @returns 성공 시 true, 실패 시 false
   * 
   * @example
   * ```typescript
   * // 게임 데이터 초기화
   * storageManager.clearGameData();
   * ```
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
   * 
   * @returns LocalStorage를 사용할 수 있으면 true, 아니면 false
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

