import { calculateStarRating } from "../starRating";
import { GameState } from "@/types/game";

describe("starRating", () => {
  const createGameState = (overrides: Partial<GameState>): GameState => ({
    board: [],
    score: 0,
    moves: 0,
    currentStage: 1,
    isPaused: false,
    isGameOver: false,
    isAnimating: false,
    comboCount: 0,
    goals: [
      {
        type: "score",
        target: 1000,
        current: 0,
      },
    ],
    selectedGem: null,
    ...overrides,
  });

  describe("calculateStarRating", () => {
    it("목표 미달성 시 0스타를 반환해야 함", () => {
      const gameState = createGameState({
        goals: [{ type: "score", target: 1000, current: 500 }],
      });

      const stars = calculateStarRating(gameState);
      expect(stars).toBe(0);
    });

    it("목표 달성 시 최소 1스타를 반환해야 함", () => {
      const gameState = createGameState({
        goals: [{ type: "score", target: 1000, current: 1000 }],
        moves: 20,
        score: 1000,
      });

      const stars = calculateStarRating(gameState);
      expect(stars).toBeGreaterThanOrEqual(1);
    });

    it("목표 120% 이상 달성 시 2스타를 반환해야 함", () => {
      const gameState = createGameState({
        goals: [{ type: "score", target: 1000, current: 1200 }],
        moves: 20,
        score: 1200,
      });

      const stars = calculateStarRating(gameState);
      expect(stars).toBeGreaterThanOrEqual(2);
    });

    it("목표 150% 이상, 이동 횟수 50% 이상, 점수 보너스 80% 이상 시 3스타를 반환해야 함", () => {
      const gameState = createGameState({
        goals: [{ type: "score", target: 1000, current: 1500 }],
        moves: 25, // baseMoves 50의 50% 이상
        score: 1500, // 목표의 1.5배
        currentStage: 1,
      });

      const stars = calculateStarRating(gameState);
      expect(stars).toBe(3);
    });

    it("목표가 없으면 0스타를 반환해야 함", () => {
      const gameState = createGameState({
        goals: [],
      });

      const stars = calculateStarRating(gameState);
      expect(stars).toBe(0);
    });

    it("이동 횟수가 많으면 별점이 낮아져야 함", () => {
      const gameState1 = createGameState({
        goals: [{ type: "score", target: 1000, current: 1500 }],
        moves: 10, // 적은 이동
        score: 1500,
      });

      const gameState2 = createGameState({
        goals: [{ type: "score", target: 1000, current: 1500 }],
        moves: 40, // 많은 이동
        score: 1500,
      });

      const stars1 = calculateStarRating(gameState1);
      const stars2 = calculateStarRating(gameState2);
      expect(stars1).toBeGreaterThanOrEqual(stars2);
    });

    it("스테이지가 높을수록 기준 이동 횟수가 줄어들어야 함", () => {
      const gameState1 = createGameState({
        goals: [{ type: "score", target: 1000, current: 1500 }],
        moves: 25,
        score: 1500,
        currentStage: 1,
      });

      const gameState2 = createGameState({
        goals: [{ type: "score", target: 1000, current: 1500 }],
        moves: 25,
        score: 1500,
        currentStage: 50,
      });

      const stars1 = calculateStarRating(gameState1);
      const stars2 = calculateStarRating(gameState2);
      // 높은 스테이지에서는 같은 이동 횟수로 더 높은 별점을 받을 수 있음
      expect(stars2).toBeGreaterThanOrEqual(stars1);
    });
  });
});

