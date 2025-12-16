import { Gem } from "@/types/gem";
import { Match } from "@/types/game";

/**
 * 매칭 결과 (특수 젬 정보 포함)
 */
export interface MatchResult {
  matches: Match[];
  specialGemPositions: Set<string>; // "row,col" 형식
}

/**
 * 게임 보드에서 매칭을 찾는 함수
 */
export function findMatches(board: (Gem | null)[][]): Match[] {
  const matches: Match[] = [];
  const processed = new Set<string>(); // 중복 매칭 방지

  // 가로 매칭 검사
  for (let row = 0; row < board.length; row++) {
    let count = 1;
    let currentColor = board[row][0]?.color;
    let startCol = 0;

    for (let col = 1; col <= board[row].length; col++) {
      const gem = board[row][col];
      if (gem && gem.color === currentColor && currentColor) {
        count++;
      } else {
        // 매칭 발견 (3개 이상)
        if (count >= 3 && currentColor) {
          const positions: { row: number; col: number }[] = [];
          for (let i = 0; i < count; i++) {
            const pos = { row, col: startCol + i };
            const key = `${pos.row},${pos.col}`;
            if (!processed.has(key)) {
              positions.push(pos);
              processed.add(key);
            }
          }
          if (positions.length > 0) {
            matches.push({
              type: "horizontal",
              positions,
            });
          }
        }
        // 다음 매칭 검사 준비
        if (gem) {
          count = 1;
          currentColor = gem.color;
          startCol = col;
        } else {
          count = 0;
          currentColor = undefined;
        }
      }
    }
  }

  // 세로 매칭 검사
  if (board.length > 0) {
    for (let col = 0; col < board[0].length; col++) {
      let count = 1;
      let currentColor = board[0][col]?.color;
      let startRow = 0;

      for (let row = 1; row <= board.length; row++) {
        const gem = row < board.length ? board[row][col] : null;
        if (gem && gem.color === currentColor && currentColor) {
          count++;
        } else {
          // 매칭 발견 (3개 이상)
          if (count >= 3 && currentColor) {
            const positions: { row: number; col: number }[] = [];
            for (let i = 0; i < count; i++) {
              const pos = { row: startRow + i, col };
              const key = `${pos.row},${pos.col}`;
              if (!processed.has(key)) {
                positions.push(pos);
                processed.add(key);
              }
            }
            if (positions.length > 0) {
              matches.push({
                type: "vertical",
                positions,
              });
            }
          }
          // 다음 매칭 검사 준비
          if (gem) {
            count = 1;
            currentColor = gem.color;
            startRow = row;
          } else {
            count = 0;
            currentColor = undefined;
          }
        }
      }
    }
  }

  return matches;
}

/**
 * 특정 위치의 젬이 매칭에 포함되는지 확인
 */
export function isPositionInMatch(
  row: number,
  col: number,
  matches: Match[]
): boolean {
  return matches.some((match) =>
    match.positions.some((pos) => pos.row === row && pos.col === col)
  );
}

/**
 * 매칭 개수에 따라 특수 젬이 생성되는지 확인
 */
export function shouldCreateSpecialGem(match: Match): boolean {
  return match.positions.length >= 4;
}

