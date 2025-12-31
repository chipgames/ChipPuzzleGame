import { Gem } from "@/types/gem";
import { findMatches } from "./matchDetection";

/**
 * 가능한 매칭 위치 찾기
 */
export interface Hint {
  from: { row: number; col: number };
  to: { row: number; col: number };
}

/**
 * 보드에서 가능한 매칭을 찾는 함수
 */
export function findPossibleMatches(board: (Gem | null)[][]): Hint | null {
  const rows = board.length;
  const cols = board[0]?.length || 0;

  // 모든 인접한 젬 쌍을 확인
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const gem = board[row]?.[col];
      if (!gem) continue;

      // 오른쪽 젬과 교환 시도
      if (col < cols - 1) {
        const rightGem = board[row]?.[col + 1];
        if (rightGem) {
          const testBoard = swapGemsInBoard(board, row, col, row, col + 1);
          const matches = findMatches(testBoard);
          if (matches.length > 0) {
            return {
              from: { row, col },
              to: { row, col: col + 1 },
            };
          }
        }
      }

      // 아래쪽 젬과 교환 시도
      if (row < rows - 1) {
        const bottomGem = board[row + 1]?.[col];
        if (bottomGem) {
          const testBoard = swapGemsInBoard(board, row, col, row + 1, col);
          const matches = findMatches(testBoard);
          if (matches.length > 0) {
            return {
              from: { row, col },
              to: { row: row + 1, col },
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * 보드에서 두 젬을 교환 (테스트용)
 */
function swapGemsInBoard(
  board: (Gem | null)[][],
  row1: number,
  col1: number,
  row2: number,
  col2: number
): (Gem | null)[][] {
  const newBoard = board.map((row) => row.map((gem) => gem ? { ...gem } : null));
  
  const temp = newBoard[row1][col1];
  newBoard[row1][col1] = newBoard[row2][col2];
  newBoard[row2][col2] = temp;

  return newBoard;
}









