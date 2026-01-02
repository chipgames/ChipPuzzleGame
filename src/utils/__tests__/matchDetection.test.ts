import { findMatches, isPositionInMatch, shouldCreateSpecialGem } from "../matchDetection";
import { Gem } from "@/types/gem";
import { Match } from "@/types/game";

describe("matchDetection", () => {
  const createGem = (color: Gem["color"], row: number, col: number): Gem => ({
    id: `${row}-${col}`,
    color,
    type: "normal",
    position: { row, col },
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  });

  describe("findMatches", () => {
    it("가로 매칭 3개를 찾아야 함", () => {
      const board: (Gem | null)[][] = [
        [
          createGem("red", 0, 0),
          createGem("red", 0, 1),
          createGem("red", 0, 2),
          createGem("blue", 0, 3),
        ],
      ];

      const matches = findMatches(board);
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe("horizontal");
      expect(matches[0].positions).toHaveLength(3);
    });

    it("세로 매칭 3개를 찾아야 함", () => {
      const board: (Gem | null)[][] = [
        [createGem("red", 0, 0), createGem("blue", 0, 1)],
        [createGem("red", 1, 0), createGem("blue", 1, 1)],
        [createGem("red", 2, 0), createGem("blue", 2, 1)],
      ];

      const matches = findMatches(board);
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe("vertical");
      expect(matches[0].positions).toHaveLength(3);
    });

    it("가로와 세로 매칭을 모두 찾아야 함", () => {
      const board: (Gem | null)[][] = [
        [
          createGem("red", 0, 0),
          createGem("red", 0, 1),
          createGem("red", 0, 2),
        ],
        [createGem("blue", 1, 0), createGem("green", 1, 1), createGem("green", 1, 2)],
        [createGem("blue", 2, 0), createGem("green", 2, 1), createGem("green", 2, 2)],
        [createGem("blue", 3, 0), createGem("green", 3, 1), createGem("green", 3, 2)],
      ];

      const matches = findMatches(board);
      expect(matches.length).toBeGreaterThanOrEqual(2);
      const horizontalMatch = matches.find((m) => m.type === "horizontal");
      const verticalMatch = matches.find((m) => m.type === "vertical");
      expect(horizontalMatch).toBeDefined();
      expect(verticalMatch).toBeDefined();
    });

    it("매칭이 없으면 빈 배열을 반환해야 함", () => {
      const board: (Gem | null)[][] = [
        [
          createGem("red", 0, 0),
          createGem("blue", 0, 1),
          createGem("green", 0, 2),
        ],
        [
          createGem("yellow", 1, 0),
          createGem("purple", 1, 1),
          createGem("orange", 1, 2),
        ],
      ];

      const matches = findMatches(board);
      expect(matches).toHaveLength(0);
    });

    it("4개 이상 매칭을 찾아야 함", () => {
      const board: (Gem | null)[][] = [
        [
          createGem("red", 0, 0),
          createGem("red", 0, 1),
          createGem("red", 0, 2),
          createGem("red", 0, 3),
        ],
      ];

      const matches = findMatches(board);
      expect(matches).toHaveLength(1);
      expect(matches[0].positions.length).toBeGreaterThanOrEqual(4);
    });

    it("null이 포함된 보드도 처리해야 함", () => {
      const board: (Gem | null)[][] = [
        [
          createGem("red", 0, 0),
          createGem("red", 0, 1),
          createGem("red", 0, 2),
          null,
        ],
      ];

      const matches = findMatches(board);
      expect(matches).toHaveLength(1);
      expect(matches[0].positions).toHaveLength(3);
    });
  });

  describe("isPositionInMatch", () => {
    it("매칭에 포함된 위치를 올바르게 감지해야 함", () => {
      const matches: Match[] = [
        {
          type: "horizontal",
          positions: [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
            { row: 0, col: 2 },
          ],
        },
      ];

      expect(isPositionInMatch(0, 0, matches)).toBe(true);
      expect(isPositionInMatch(0, 1, matches)).toBe(true);
      expect(isPositionInMatch(0, 2, matches)).toBe(true);
      expect(isPositionInMatch(1, 0, matches)).toBe(false);
    });
  });

  describe("shouldCreateSpecialGem", () => {
    it("4개 이상 매칭 시 특수 젬 생성해야 함", () => {
      const match: Match = {
        type: "horizontal",
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      };

      expect(shouldCreateSpecialGem(match)).toBe(true);
    });

    it("3개 매칭 시 특수 젬 생성하지 않아야 함", () => {
      const match: Match = {
        type: "horizontal",
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
        ],
      };

      expect(shouldCreateSpecialGem(match)).toBe(false);
    });
  });
});

