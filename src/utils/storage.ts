/**
 * LocalStorage 유틸리티
 * 에러 처리, fallback, 타입 안정성 포함
 */

import { logger } from "./logger";

interface StorageOptions {
  fallback?: any;
  silent?: boolean; // 에러를 조용히 처리할지 여부
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
      try {
        return JSON.parse(item) as T;
      } catch (parseError) {
        // JSON이 아닌 경우 (예: 이전에 문자열로 저장된 경우)
        // 문자열로 저장된 값이면 그대로 반환
        if (typeof item === "string" && item.startsWith('"') && item.endsWith('"')) {
          // JSON 문자열로 감싸진 경우
          return JSON.parse(item) as T;
        }
        // 순수 문자열인 경우 타입에 맞게 반환
        if (typeof options.fallback === "string") {
          return item as T;
        }
        // 파싱 실패 시 오래된 데이터로 간주하고 제거
        localStorage.removeItem(key);
        if (!options.silent) {
          logger.warn("Removed invalid storage data", { key, value: item });
        }
        return options.fallback ?? null;
      }
    } catch (error) {
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

