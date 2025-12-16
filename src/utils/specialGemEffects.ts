import { Gem } from "@/types/gem";
import { Match } from "@/types/game";

/**
 * 특수 젬 활성화 효과 처리
 */
export interface SpecialGemEffect {
  positionsToRemove: { row: number; col: number }[];
  score: number;
}

/**
 * 스트라이프 젬 활성화 (가로/세로 한 줄 제거)
 */
export function activateStripedGem(
  gem: Gem,
  board: (Gem | null)[][],
  direction: "horizontal" | "vertical"
): SpecialGemEffect {
  const positionsToRemove: { row: number; col: number }[] = [];
  const { row, col } = gem.position;

  if (direction === "horizontal") {
    // 가로 한 줄 제거
    for (let c = 0; c < board[0]?.length || 0; c++) {
      if (board[row]?.[c]) {
        positionsToRemove.push({ row, col: c });
      }
    }
  } else {
    // 세로 한 줄 제거
    for (let r = 0; r < board.length; r++) {
      if (board[r]?.[col]) {
        positionsToRemove.push({ row: r, col });
      }
    }
  }

  return {
    positionsToRemove,
    score: positionsToRemove.length * 20,
  };
}

/**
 * 래핑 젬 활성화 (3x3 범위 폭발)
 */
export function activateWrappedGem(
  gem: Gem,
  board: (Gem | null)[][]
): SpecialGemEffect {
  const positionsToRemove: { row: number; col: number }[] = [];
  const { row, col } = gem.position;

  // 3x3 범위
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (
        r >= 0 &&
        r < board.length &&
        c >= 0 &&
        c < (board[0]?.length || 0) &&
        board[r]?.[c]
      ) {
        positionsToRemove.push({ row: r, col: c });
      }
    }
  }

  return {
    positionsToRemove,
    score: positionsToRemove.length * 30,
  };
}

/**
 * 컬러봄 활성화 (같은 색상 모두 제거)
 */
export function activateColorBomb(
  gem: Gem,
  board: (Gem | null)[][]
): SpecialGemEffect {
  const positionsToRemove: { row: number; col: number }[] = [];
  const targetColor = gem.color;

  // 보드 전체에서 같은 색상 찾기
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < (board[r]?.length || 0); c++) {
      const gem = board[r]?.[c];
      if (gem && gem.color === targetColor) {
        positionsToRemove.push({ row: r, col: c });
      }
    }
  }

  return {
    positionsToRemove,
    score: positionsToRemove.length * 50,
  };
}

/**
 * 특수 젬 활성화 (일반 처리)
 */
export function activateSpecialGem(
  gem: Gem,
  board: (Gem | null)[][]
): SpecialGemEffect {
  switch (gem.type) {
    case "striped":
      return activateStripedGem(
        gem,
        board,
        gem.stripedDirection || "horizontal"
      );
    case "wrapped":
      return activateWrappedGem(gem, board);
    case "colorBomb":
      return activateColorBomb(gem, board);
    default:
      return { positionsToRemove: [], score: 0 };
  }
}

