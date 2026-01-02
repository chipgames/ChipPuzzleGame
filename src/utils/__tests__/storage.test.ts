import { storageManager } from "../storage";
import { GameProgress } from "@/types/storage";

describe("storage", () => {
  beforeEach(() => {
    // 각 테스트 전에 localStorage 초기화
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("get", () => {
    it("저장된 값을 올바르게 가져와야 함", () => {
      const testData = { test: "value" };
      storageManager.set("test_key", testData);

      const result = storageManager.get("test_key");
      expect(result).toEqual(testData);
    });

    it("존재하지 않는 키는 null을 반환해야 함", () => {
      const result = storageManager.get("non_existent_key");
      expect(result).toBeNull();
    });

    it("fallback 옵션이 있으면 fallback 값을 반환해야 함", () => {
      const fallback = { default: "value" };
      const result = storageManager.get("non_existent_key", { fallback });
      expect(result).toEqual(fallback);
    });

    it("유효하지 않은 JSON은 제거하고 fallback을 반환해야 함", () => {
      localStorage.setItem("chipPuzzleGame_progress", "invalid json");
      
      const fallback: GameProgress = {
        highestStage: 1,
        stageRecords: {},
      };
      
      const result = storageManager.get<GameProgress>("chipPuzzleGame_progress", {
        fallback,
        silent: true,
      });
      
      expect(result).toEqual(fallback);
      // 유효하지 않은 데이터는 제거되어야 함
      expect(localStorage.getItem("chipPuzzleGame_progress")).toBeNull();
    });
  });

  describe("set", () => {
    it("값을 올바르게 저장해야 함", () => {
      const testData = { test: "value" };
      const result = storageManager.set("test_key", testData);
      
      expect(result).toBe(true);
      const stored = localStorage.getItem("test_key");
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(testData);
    });

    it("게임 진행 데이터는 검증 후 저장해야 함", () => {
      const validProgress: GameProgress = {
        highestStage: 5,
        stageRecords: {
          "1": {
            stageNumber: 1,
            stars: 3,
            score: 1000,
            bestScore: 1000,
            completedAt: new Date().toISOString(),
            attempts: 1,
          },
        },
      };

      const result = storageManager.set("chipPuzzleGame_progress", validProgress);
      expect(result).toBe(true);
    });

    it("유효하지 않은 게임 진행 데이터는 저장하지 않아야 함", () => {
      const invalidProgress = {
        highestStage: -1, // 유효하지 않은 값
        stageRecords: {},
      };

      const result = storageManager.set("chipPuzzleGame_progress", invalidProgress);
      expect(result).toBe(false);
    });

    it("용량이 5MB를 초과하면 저장하지 않아야 함", () => {
      const largeData = "x".repeat(6 * 1024 * 1024); // 6MB
      const result = storageManager.set("large_key", largeData);
      expect(result).toBe(false);
    });
  });

  describe("remove", () => {
    it("값을 올바르게 제거해야 함", () => {
      storageManager.set("test_key", { test: "value" });
      const result = storageManager.remove("test_key");
      
      expect(result).toBe(true);
      expect(localStorage.getItem("test_key")).toBeNull();
    });
  });

  describe("clearGameData", () => {
    it("게임 데이터만 제거해야 함", () => {
      storageManager.set("chipPuzzleGame_progress", {
        highestStage: 1,
        stageRecords: {},
      });
      storageManager.set("other_key", { data: "value" });

      const result = storageManager.clearGameData();
      expect(result).toBe(true);
      expect(localStorage.getItem("chipPuzzleGame_progress")).toBeNull();
      expect(localStorage.getItem("other_key")).toBeTruthy();
    });
  });

  describe("available", () => {
    it("LocalStorage 사용 가능 여부를 올바르게 반환해야 함", () => {
      const available = storageManager.available();
      expect(typeof available).toBe("boolean");
    });
  });
});

