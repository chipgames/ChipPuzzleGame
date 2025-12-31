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
 * 특수 젬 조합 효과
 */

/**
 * 스트라이프 + 스트라이프 = 십자 폭발
 */
export function activateStripedStriped(
  gem1: Gem,
  gem2: Gem,
  board: (Gem | null)[][]
): SpecialGemEffect {
  const positionsToRemove: { row: number; col: number }[] = [];
  const { row, col } = gem1.position;

  // 가로 한 줄
  for (let c = 0; c < board[0]?.length || 0; c++) {
    if (board[row]?.[c]) {
      positionsToRemove.push({ row, col: c });
    }
  }

  // 세로 한 줄
  for (let r = 0; r < board.length; r++) {
    if (board[r]?.[col]) {
      positionsToRemove.push({ row: r, col });
    }
  }

  // 중복 제거
  const uniquePositions = Array.from(
    new Set(positionsToRemove.map((p) => `${p.row},${p.col}`))
  ).map((key) => {
    const [r, c] = key.split(",").map(Number);
    return { row: r, col: c };
  });

  return {
    positionsToRemove: uniquePositions,
    score: uniquePositions.length * 30,
  };
}

/**
 * 스트라이프 + 래핑 = 스트라이프 방향으로 3줄 제거
 */
export function activateStripedWrapped(
  gem1: Gem,
  gem2: Gem,
  board: (Gem | null)[][]
): SpecialGemEffect {
  const positionsToRemove: { row: number; col: number }[] = [];
  const stripedGem = gem1.type === "striped" ? gem1 : gem2;
  const wrappedGem = gem1.type === "wrapped" ? gem1 : gem2;
  const direction = stripedGem.stripedDirection || "horizontal";
  const { row, col } = wrappedGem.position;

  if (direction === "horizontal") {
    // 가로 3줄 제거
    for (let r = row - 1; r <= row + 1; r++) {
      if (r >= 0 && r < board.length) {
        for (let c = 0; c < board[0]?.length || 0; c++) {
          if (board[r]?.[c]) {
            positionsToRemove.push({ row: r, col: c });
          }
        }
      }
    }
  } else {
    // 세로 3줄 제거
    for (let c = col - 1; c <= col + 1; c++) {
      if (c >= 0 && c < (board[0]?.length || 0)) {
        for (let r = 0; r < board.length; r++) {
          if (board[r]?.[c]) {
            positionsToRemove.push({ row: r, col: c });
          }
        }
      }
    }
  }

  return {
    positionsToRemove,
    score: positionsToRemove.length * 40,
  };
}

/**
 * 스트라이프 + 컬러봄 = 전체 보드 스트라이프 효과 (같은 색상 모두 제거)
 */
export function activateStripedColorBomb(
  gem1: Gem,
  gem2: Gem,
  board: (Gem | null)[][]
): SpecialGemEffect {
  const positionsToRemove: { row: number; col: number }[] = [];
  const stripedGem = gem1.type === "striped" ? gem1 : gem2;
  const colorBomb = gem1.type === "colorBomb" ? gem1 : gem2;
  const targetColor = stripedGem.color;
  const direction = stripedGem.stripedDirection || "horizontal";

  if (direction === "horizontal") {
    // 가로 줄에서 같은 색상 모두 제거
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < (board[r]?.length || 0); c++) {
        const gem = board[r]?.[c];
        if (gem && gem.color === targetColor) {
          positionsToRemove.push({ row: r, col: c });
        }
      }
    }
  } else {
    // 세로 줄에서 같은 색상 모두 제거
    for (let c = 0; c < (board[0]?.length || 0); c++) {
      for (let r = 0; r < board.length; r++) {
        const gem = board[r]?.[c];
        if (gem && gem.color === targetColor) {
          positionsToRemove.push({ row: r, col: c });
        }
      }
    }
  }

  return {
    positionsToRemove,
    score: positionsToRemove.length * 60,
  };
}

/**
 * 래핑 + 래핑 = 5x5 범위 폭발
 */
export function activateWrappedWrapped(
  gem1: Gem,
  gem2: Gem,
  board: (Gem | null)[][]
): SpecialGemEffect {
  const positionsToRemove: { row: number; col: number }[] = [];
  const { row, col } = gem1.position;

  // 5x5 범위
  for (let r = row - 2; r <= row + 2; r++) {
    for (let c = col - 2; c <= col + 2; c++) {
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
    score: positionsToRemove.length * 50,
  };
}

/**
 * 래핑 + 컬러봄 = 전체 보드에서 래핑 젬 색상 모두 제거
 */
export function activateWrappedColorBomb(
  gem1: Gem,
  gem2: Gem,
  board: (Gem | null)[][]
): SpecialGemEffect {
  const positionsToRemove: { row: number; col: number }[] = [];
  const wrappedGem = gem1.type === "wrapped" ? gem1 : gem2;
  const targetColor = wrappedGem.color;

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
    score: positionsToRemove.length * 70,
  };
}

/**
 * 컬러봄 + 컬러봄 = 전체 보드 제거
 */
export function activateColorBombColorBomb(
  gem1: Gem,
  gem2: Gem,
  board: (Gem | null)[][]
): SpecialGemEffect {
  const positionsToRemove: { row: number; col: number }[] = [];

  // 전체 보드 제거
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < (board[r]?.length || 0); c++) {
      if (board[r]?.[c]) {
        positionsToRemove.push({ row: r, col: c });
      }
    }
  }

  return {
    positionsToRemove,
    score: positionsToRemove.length * 100,
  };
}

/**
 * 특수 젬 조합 활성화
 */
export function activateSpecialGemCombo(
  gem1: Gem,
  gem2: Gem,
  board: (Gem | null)[][]
): SpecialGemEffect | null {
  const types = [gem1.type, gem2.type].sort().join("+");

  switch (types) {
    case "striped+striped":
      return activateStripedStriped(gem1, gem2, board);
    case "striped+wrapped":
      return activateStripedWrapped(gem1, gem2, board);
    case "colorBomb+striped":
      return activateStripedColorBomb(gem1, gem2, board);
    case "wrapped+wrapped":
      return activateWrappedWrapped(gem1, gem2, board);
    case "colorBomb+wrapped":
      return activateWrappedColorBomb(gem1, gem2, board);
    case "colorBomb+colorBomb":
      return activateColorBombColorBomb(gem1, gem2, board);
    default:
      return null;
  }
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









