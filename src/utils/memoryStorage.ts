/**
 * 메모리 기반 저장소 (LocalStorage 폴백)
 * LocalStorage를 사용할 수 없을 때 세션 동안만 데이터를 메모리에 저장
 */

import { logger } from "./logger";

class MemoryStorage {
  private storage: Map<string, string> = new Map();

  /**
   * 메모리에서 값 가져오기
   */
  public get<T>(key: string): T | null {
    try {
      const item = this.storage.get(key);
      if (item === undefined) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      logger.warn("Failed to parse memory storage", { key, error });
      return null;
    }
  }

  /**
   * 메모리에 값 저장하기
   */
  public set<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      this.storage.set(key, serialized);
      return true;
    } catch (error) {
      logger.error("Failed to set item to memory storage", { key, error });
      return false;
    }
  }

  /**
   * 메모리에서 값 제거하기
   */
  public remove(key: string): boolean {
    return this.storage.delete(key);
  }

  /**
   * 메모리 전체 비우기
   */
  public clear(): void {
    this.storage.clear();
  }

  /**
   * 모든 키 가져오기
   */
  public keys(): string[] {
    return Array.from(this.storage.keys());
  }
}

export const memoryStorage = new MemoryStorage();

